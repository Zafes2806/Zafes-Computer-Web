import { useCallback, useEffect, useMemo, useState } from 'react';

import { requestGetComponentTypesPublic } from '../api';
import {
    COMPONENT_TYPE_DEFINITIONS,
    normalizeComponentTypeList,
} from '../constants/componentTypes';

export function useComponentTypes(params = {}) {
    const paramsKey = JSON.stringify(params);
    const normalizedParams = useMemo(() => JSON.parse(paramsKey), [paramsKey]);
    const [componentTypes, setComponentTypes] = useState(() =>
        normalizeComponentTypeList(COMPONENT_TYPE_DEFINITIONS, normalizedParams),
    );
    const [loading, setLoading] = useState(false);

    const fetchComponentTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await requestGetComponentTypesPublic(normalizedParams);
            setComponentTypes(normalizeComponentTypeList(response.metadata, normalizedParams));
        } catch {
            setComponentTypes(normalizeComponentTypeList(COMPONENT_TYPE_DEFINITIONS, normalizedParams));
        } finally {
            setLoading(false);
        }
    }, [normalizedParams]);

    useEffect(() => {
        fetchComponentTypes();
    }, [fetchComponentTypes]);

    return {
        componentTypes,
        loading,
        refetch: fetchComponentTypes,
    };
}
