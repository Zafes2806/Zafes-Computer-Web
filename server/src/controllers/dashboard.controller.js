const { OK } = require('../core/success.response');
const dashboardService = require('../services/dashboard.service');

async function getDashboardStats(req, res) {
    const metadata = await dashboardService.getDashboardStats(req.query);
    return new OK({ message: 'Lấy thống kê tổng quan thành công', metadata }).send(res);
}

async function getOrderStats(req, res) {
    const metadata = await dashboardService.getOrderStats(req.query);
    return new OK({ message: 'Lấy thống kê đơn hàng thành công', metadata }).send(res);
}

async function getChartData(req, res) {
    const metadata = await dashboardService.getChartData(req.query);
    return new OK({ message: 'Lấy dữ liệu biểu đồ thành công', metadata }).send(res);
}

module.exports = {
    getChartData,
    getDashboardStats,
    getOrderStats,
};
