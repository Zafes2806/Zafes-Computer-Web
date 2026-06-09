import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    message,
    Row,
    Spin,
    Statistic,
    Table,
    Typography,
} from 'antd';
import {
    DollarOutlined,
    EyeOutlined,
    FileTextOutlined,
    MessageOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
    StarOutlined,
    StopOutlined,
    SwapRightOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import classNames from 'classnames/bind';
import dayjs from 'dayjs';

import styles from './DashBoard.module.scss';
import { requestDashboard, requestGetChartData, requestGetOrderStats } from '../../../../api';
import { AdminMetaTag, AdminStatusTag, AdminStockTag } from '../shared/AdminTag';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;
const cx = classNames.bind(styles);
const disableFutureDate = (current) => current && current.endOf('day').isAfter(dayjs().endOf('day'));
const MAX_DASHBOARD_RANGE_DAYS = 90;
const DEFAULT_DASHBOARD_RANGE_DAYS = 30;

const emptyStatistics = {
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalWatching: 0,
};

const emptyQueues = {
    inactiveProducts: 0,
    lockedUsers: 0,
    draftBlogs: 0,
    newContacts: 0,
    pendingReviews: 0,
};

function formatCurrency(value = 0) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function DashBoard({ onNavigate }) {
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [statistics, setStatistics] = useState(emptyStatistics);
    const [queues, setQueues] = useState(emptyQueues);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [orderStats, setOrderStats] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [orderStatusStats, setOrderStatusStats] = useState([]);
    const [dateRange, setDateRange] = useState(null);
    const [rangeWarning, setRangeWarning] = useState('');

    const requestParams = useMemo(() => {
        if (dateRange?.[0] && dateRange?.[1]) {
            return {
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
            };
        }

        const endDate = dayjs();
        const startDate = endDate.subtract(DEFAULT_DASHBOARD_RANGE_DAYS - 1, 'day');
        return {
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
        };
    }, [dateRange]);

    const handleDateRangeChange = (nextRange) => {
        if (!nextRange || !nextRange[0] || !nextRange[1]) {
            setRangeWarning('');
            setDateRange(null);
            return;
        }

        const diffDays = nextRange[1].startOf('day').diff(nextRange[0].startOf('day'), 'day') + 1;

        if (diffDays > MAX_DASHBOARD_RANGE_DAYS) {
            const warningMessage = `Dashboard chỉ hỗ trợ tối đa ${MAX_DASHBOARD_RANGE_DAYS} ngày cho mỗi lần xem thống kê.`;
            setRangeWarning(warningMessage);
            messageApi.warning(warningMessage);
            return;
        }

        setRangeWarning('');
        setDateRange(nextRange);
    };

    const fetchDashboard = useCallback(
        async ({ silent = false } = {}) => {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            try {
                const [dashboardResponse, orderStatsResponse, chartResponse] = await Promise.all([
                    requestDashboard(requestParams),
                    requestGetOrderStats(requestParams),
                    requestGetChartData(requestParams),
                ]);

                const {
                    statistics: statsData = emptyStatistics,
                    queues: queueData = emptyQueues,
                    recentOrders: ordersData = [],
                    topProducts: productsData = [],
                } = dashboardResponse.metadata || {};

                setStatistics(statsData);
                setQueues(queueData);
                setRecentOrders(
                    ordersData.map((order) => ({
                        key: order.id,
                        ...order,
                    })),
                );
                setTopProducts(
                    productsData.map((product) => ({
                        key: product.id,
                        ...product,
                    })),
                );
                setOrderStats(Array.isArray(orderStatsResponse.metadata) ? orderStatsResponse.metadata : []);
                setCategoryStats(Array.isArray(chartResponse.metadata?.categoryStats) ? chartResponse.metadata.categoryStats : []);
                setOrderStatusStats(Array.isArray(chartResponse.metadata?.orderStats) ? chartResponse.metadata.orderStats : []);
            } catch (fetchError) {
                setError(fetchError?.response?.data?.message || 'Không thể tải dữ liệu dashboard');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [requestParams],
    );

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const primaryStats = [
        {
            key: 'users',
            title: 'Tổng người dùng',
            value: statistics.totalUsers,
            prefix: <UserOutlined />,
        },
        {
            key: 'products',
            title: 'Tổng sản phẩm',
            value: statistics.totalProducts,
            prefix: <ShoppingCartOutlined />,
        },
        {
            key: 'revenue',
            title: 'Doanh thu',
            value: statistics.totalRevenue,
            prefix: <DollarOutlined />,
            formatter: (value) => Number(value || 0).toLocaleString('vi-VN'),
            suffix: 'đ',
        },
        {
            key: 'watching',
            title: 'Sản phẩm được theo dõi',
            value: statistics.totalWatching,
            prefix: <EyeOutlined />,
        },
    ];

    const queueCards = [
        {
            key: 'inactiveProducts',
            title: 'Sản phẩm tạm khóa',
            value: queues.inactiveProducts,
            prefix: <StopOutlined />,
            onClick: () => onNavigate?.('products', { status: 'inactive', scope: 'managed' }),
        },
        {
            key: 'lockedUsers',
            title: 'Người dùng bị khóa',
            value: queues.lockedUsers,
            prefix: <UserOutlined />,
            onClick: () => onNavigate?.('users', { status: 'locked', scope: 'managed' }),
        },
        {
            key: 'draftBlogs',
            title: 'Bài viết nháp',
            value: queues.draftBlogs,
            prefix: <FileTextOutlined />,
            onClick: () => onNavigate?.('blogs', { status: 'draft', scope: 'managed' }),
        },
        {
            key: 'newContacts',
            title: 'Liên hệ mới',
            value: queues.newContacts,
            prefix: <MessageOutlined />,
            onClick: () => onNavigate?.('contact', { status: 'new', scope: 'managed' }),
        },
        {
            key: 'pendingReviews',
            title: 'Đánh giá chờ duyệt',
            value: queues.pendingReviews,
            prefix: <StarOutlined />,
            onClick: () => onNavigate?.('reviews', { status: 'pending', scope: 'managed' }),
        },
    ];

    const orderColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderCode',
            key: 'orderCode',
            width: 150,
            render: (value) => <span className={cx('cellBreak')}>{value}</span>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (value) => <span className={cx('cellClamp')}>{value}</span>,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            align: 'right',
            render: (value) => formatCurrency(value),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 180,
            render: (status) => <AdminStatusTag domain="order" status={status} className={cx('statusTag')} />,
        },
    ];

    const productColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (value) => <span className={cx('cellClamp')}>{value}</span>,
        },
        {
            title: 'Loại',
            dataIndex: 'componentType',
            key: 'componentType',
            width: 120,
            render: (value) => <AdminMetaTag variant="info">{String(value || '').toUpperCase()}</AdminMetaTag>,
        },
        {
            title: 'Đã bán',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 90,
            align: 'right',
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stock',
            key: 'stock',
            width: 100,
            align: 'right',
            render: (stock) => <AdminStockTag stock={stock} prefix="" />,
        },
    ];

    const orderChartConfig = {
        data: orderStats,
        xField: 'date',
        yField: 'count',
        color: '#1677ff',
        label: false,
        xAxis: {
            label: {
                autoHide: true,
            },
        },
    };

    const categoryConfig = {
        data: categoryStats,
        angleField: 'value',
        colorField: 'type',
        radius: 0.8,
        label: false,
        legend: {
            position: 'bottom',
        },
        interactions: [{ type: 'element-active' }],
    };

    const orderStatusConfig = {
        data: orderStatusStats,
        angleField: 'value',
        colorField: 'status',
        radius: 0.8,
        label: false,
        legend: {
            position: 'bottom',
        },
        interactions: [{ type: 'element-active' }],
    };

    if (loading) {
        return (
            <div className={cx('loadingState')}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className={`${cx('wrapper')} admin-page admin-card`}>
            {contextHolder}
            <div className="admin-page-header">
                <div className="admin-page-header-main">
                    <Title level={2} className={cx('pageTitle')}>
                        Tổng quan
                    </Title>
                </div>
            </div>

            <div className="admin-toolbar">
                <div className="admin-toolbar-group admin-toolbar-group-fluid">
                    <RangePicker
                        size="large"
                        className={cx('dashboardRange')}
                        placeholder={['Từ ngày', 'Đến ngày']}
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        disabledDate={disableFutureDate}
                        format="DD/MM/YYYY"
                        separator={<SwapRightOutlined />}
                    />
                </div>
                <div className="admin-toolbar-end">
                    <Button icon={<ReloadOutlined />} onClick={() => fetchDashboard({ silent: true })} loading={refreshing}>
                        Làm mới
                    </Button>
                </div>
            </div>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message="Không thể tải đầy đủ dữ liệu dashboard"
                    description={error}
                />
            )}

            {rangeWarning && (
                <Alert
                    type="warning"
                    showIcon
                    message={rangeWarning}
                />
            )}

            <Row gutter={[16, 16]}>
                {primaryStats.map((item) => (
                    <Col key={item.key} xs={24} sm={12} xl={6}>
                        <Card className={cx('simpleCard')}>
                            <Statistic
                                title={item.title}
                                value={item.value}
                                prefix={item.prefix}
                                formatter={item.formatter}
                                suffix={item.suffix}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className={cx('sectionCard')} title="Việc cần xử lý">
                <Row gutter={[16, 16]}>
                    {queueCards.map((item) => (
                        <Col key={item.key} xs={24} sm={12} lg={8} xl={4}>
                            <button type="button" className={cx('queueButton')} onClick={item.onClick}>
                                <Statistic title={item.title} value={item.value} prefix={item.prefix} />
                                <Text className={cx('queueHint')}>Mở chi tiết</Text>
                            </button>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24}>
                    <Card
                        title="Tổng quan đơn hàng"
                        extra={<Button type="link" onClick={() => onNavigate?.('order')}>Xem đơn hàng</Button>}
                        className={cx('sectionCard')}
                    >
                        {orderStats.length ? <Column {...orderChartConfig} /> : <Empty description="Chưa có dữ liệu đơn hàng" />}
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Phân bố danh mục bán ra" className={cx('sectionCard')}>
                        {categoryStats.length ? <Pie {...categoryConfig} /> : <Empty description="Chưa có dữ liệu" />}
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Trạng thái đơn hàng" className={cx('sectionCard')}>
                        {orderStatusStats.length ? <Pie {...orderStatusConfig} /> : <Empty description="Chưa có dữ liệu" />}
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card
                        title="Đơn hàng gần đây"
                        extra={<Button type="link" onClick={() => onNavigate?.('order')}>Xem tất cả</Button>}
                        className={cx('sectionCard')}
                    >
                        <Table
                            columns={orderColumns}
                            dataSource={recentOrders}
                            pagination={false}
                            className="admin-table"
                            tableLayout="fixed"
                            size="middle"
                            locale={{ emptyText: <Empty description="Không có đơn hàng" /> }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title="Sản phẩm bán chạy"
                        extra={<Button type="link" onClick={() => onNavigate?.('products')}>Xem sản phẩm</Button>}
                        className={cx('sectionCard')}
                    >
                        <Table
                            columns={productColumns}
                            dataSource={topProducts}
                            pagination={false}
                            className="admin-table"
                            tableLayout="fixed"
                            size="middle"
                            locale={{ emptyText: <Empty description="Không có dữ liệu bán hàng" /> }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default DashBoard;

