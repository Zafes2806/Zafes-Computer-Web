import React, { useCallback, useEffect, useState } from 'react';
import { Card, Checkbox, Collapse, Empty, Spin } from 'antd';
import classNames from 'classnames/bind';
import { requestGetCategoryByComponentTypes } from '../../api';
import { COMPONENT_TYPE_LABELS, COMPONENT_TYPE_ORDER, getBaseComponentType } from '../../constants/componentTypes';
import styles from './CategoryComponentFilter.module.scss';

const { Panel } = Collapse;
const cx = classNames.bind(styles);
const EMPTY_FILTERS = [];

function CategoryComponentFilter({
    onChange,
    onSpecChange,
    categoryId,
    filters,
    selectedIds = [],
    activeComponentType = '',
}) {
    const [componentGroups, setComponentGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedParts, setSelectedParts] = useState([]);

    const isSpecFilterMode = Boolean(activeComponentType);
    const providedFilters = Array.isArray(filters) ? filters : EMPTY_FILTERS;

    const deduplicateComponentsByName = useCallback((components = []) => {
        const uniqueComponents = new Map();

        components.forEach((component) => {
            if (!component?.name) return;

            const existing = uniqueComponents.get(component.name);
            const nextProductIds = Array.isArray(component.allProductIds) && component.allProductIds.length > 0
                ? component.allProductIds
                : [component.productId].filter(Boolean);

            if (!existing) {
                uniqueComponents.set(component.name, {
                    id: component.id,
                    name: component.name,
                    type: component.type,
                    productId: component.productId,
                    allProductIds: [...new Set(nextProductIds)],
                    specBased: Boolean(component.specBased),
                    count: component.count,
                });
                return;
            }

            existing.allProductIds = [...new Set([...existing.allProductIds, ...nextProductIds].filter(Boolean))];
            existing.count = component.count ?? existing.count;
        });

        return Array.from(uniqueComponents.values());
    }, []);

    const sortGroups = useCallback((groups = []) => {
        return [...groups].sort((a, b) => {
            const aBase = getBaseComponentType(a.type);
            const bBase = getBaseComponentType(b.type);
            const aIdx = COMPONENT_TYPE_ORDER.indexOf(aBase);
            const bIdx = COMPONENT_TYPE_ORDER.indexOf(bBase);

            if (aIdx !== bIdx) return aIdx - bIdx;
            if (a.specBased && !b.specBased) return -1;
            if (!a.specBased && b.specBased) return 1;
            return (a.label || a.type).localeCompare(b.label || b.type, 'vi');
        });
    }, []);

    const getVisibleGroups = useCallback((groups = []) => {
        const normalizedGroups = groups
            .map((group) => ({
                ...group,
                components: deduplicateComponentsByName(group.components || []),
            }))
            .filter((group) => {
                if (isSpecFilterMode) {
                    return group.specBased && getBaseComponentType(group.type) === activeComponentType;
                }

                return !group.specBased;
            });

        return sortGroups(normalizedGroups);
    }, [activeComponentType, deduplicateComponentsByName, isSpecFilterMode, sortGroups]);

    useEffect(() => {
        setSelectedParts([]);
    }, [activeComponentType, categoryId]);

    useEffect(() => {
        let cancelled = false;

        const loadFilters = async () => {
            if (providedFilters.length > 0) {
                setComponentGroups(getVisibleGroups(providedFilters));
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const params = {};
                if (categoryId) {
                    params.categoryId = categoryId;
                }
                if (activeComponentType) {
                    params.componentType = activeComponentType;
                }

                const result = await requestGetCategoryByComponentTypes(params);
                if (cancelled) return;

                setComponentGroups(getVisibleGroups(Array.isArray(result) ? result : []));
            } catch (error) {
                console.error('Error fetching component parts:', error);
                if (!cancelled) {
                    setComponentGroups([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadFilters();

        return () => {
            cancelled = true;
        };
    }, [activeComponentType, categoryId, getVisibleGroups, providedFilters]);

    const handleSpecPartChange = (checked, part) => {
        const nextSelectedParts = checked
            ? [...selectedParts, part]
            : selectedParts.filter((item) => item.id !== part.id);

        setSelectedParts(nextSelectedParts);

        if (onSpecChange) {
            const nextSpecFilters = nextSelectedParts.reduce((accumulator, item) => {
                const [, specKey] = String(item.type || '').split(':');
                if (!specKey) return accumulator;

                if (!accumulator[specKey]) {
                    accumulator[specKey] = [];
                }

                accumulator[specKey].push(item.name);
                return accumulator;
            }, {});

            onSpecChange(nextSpecFilters);
        }
    };

    const handleComponentPartChange = (checked, partId, productIds = []) => {
        const nextSelectedParts = checked
            ? [...selectedParts, { id: partId, productIds }]
            : selectedParts.filter((item) => item.id !== partId);

        setSelectedParts(nextSelectedParts);

        if (onChange) {
            const allProductIds = nextSelectedParts.flatMap((item) => item.productIds || []);
            onChange([...new Set(allProductIds)]);
        }
    };

    const cardTitle = isSpecFilterMode ? 'Thông số' : 'Bộ lọc';
    const emptyDescription = isSpecFilterMode
        ? 'Chưa có dữ liệu thông số để tạo bộ lọc. Hãy bổ sung product_specs cho các sản phẩm này.'
        : 'Chưa có bộ lọc phù hợp';

    if (loading) {
        return (
            <Card className={cx('component-filter-card')} title={cardTitle}>
                <Spin />
            </Card>
        );
    }

    if (componentGroups.length === 0) {
        return (
            <Card className={cx('component-filter-card')} title={cardTitle}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={emptyDescription}
                    className={cx('empty-state')}
                />
            </Card>
        );
    }

    return (
        <Card className={cx('component-filter-card')} title={cardTitle}>
            <div className={cx('filter-scroll-container')}>
                <Collapse defaultActiveKey={[]}>
                    {componentGroups.map((group) => (
                        <Panel
                            header={`${group.specBased ? group.label : (COMPONENT_TYPE_LABELS[group.type] || group.type)} (${group.components?.length || 0})`}
                            key={group.type}
                        >
                            <div className={cx('component-list')}>
                                {(group.components || []).map((part) => (
                                    <div key={part.id} className={cx('component-item')}>
                                        <Checkbox
                                            checked={
                                                isSpecFilterMode
                                                    ? selectedParts.some((item) => item.id === part.id)
                                                    : (part.allProductIds || [part.productId]).some((id) => selectedIds.includes(id))
                                            }
                                            onChange={(e) => {
                                                if (isSpecFilterMode) {
                                                    handleSpecPartChange(e.target.checked, part);
                                                    return;
                                                }

                                                handleComponentPartChange(e.target.checked, part.id, part.allProductIds);
                                            }}
                                        >
                                            {part.name}
                                        </Checkbox>
                                    </div>
                                ))}

                                {group.components?.length === 0 && (
                                    <div className={cx('no-results')}>Không tìm thấy linh kiện phù hợp</div>
                                )}
                            </div>
                        </Panel>
                    ))}
                </Collapse>
            </div>
        </Card>
    );
}

export default CategoryComponentFilter;
