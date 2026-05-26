const { Op } = require('sequelize');

const config = require('../config/env');
const { connect } = require('../config/index');
const modelOrder = require('../models/order.model');
const paymentAttemptService = require('./paymentAttempt.service');

const ORDER_AUTO_COMPLETE_DELAY_HOURS = config.orders.autoCompleteDelayHours;
const ORDER_AUTO_COMPLETE_INTERVAL_MS = config.orders.autoCompleteIntervalMs;
const ORDER_PENDING_PAYMENT_TIMEOUT_MS = config.orders.pendingPaymentTimeoutMs;

function getDeliveredCutoffDate() {
    return new Date(Date.now() - ORDER_AUTO_COMPLETE_DELAY_HOURS * 60 * 60 * 1000);
}

async function autoCompleteDeliveredOrders() {
    const cutoffDate = getDeliveredCutoffDate();

    const orders = await modelOrder.findAll({
        where: {
            status: 'delivered',
            [Op.or]: [
                { deliveredAt: { [Op.lte]: cutoffDate } },
                {
                    deliveredAt: null,
                    updatedAt: { [Op.lte]: cutoffDate },
                },
            ],
        },
        order: [['updatedAt', 'ASC']],
    });

    if (!orders.length) {
        return 0;
    }

    await connect.transaction(async (transaction) => {
        for (const order of orders) {
            await order.update(
                {
                    status: 'completed',
                    completedAt: new Date(),
                },
                { transaction },
            );
        }
    });

    return orders.length;
}

function startOrderLifecycleJobs() {
    const runSafely = async () => {
        try {
            const completedCount = await autoCompleteDeliveredOrders();
            const expiredPaymentCount = await paymentAttemptService.expirePendingAttempts(ORDER_PENDING_PAYMENT_TIMEOUT_MS);
            const stalePendingPaymentCount = await paymentAttemptService.expireStalePendingPaymentOrders(ORDER_PENDING_PAYMENT_TIMEOUT_MS);

            if (completedCount > 0) {
                console.log(`[orders] Auto-completed ${completedCount} delivered order(s)`);
            }
            if (expiredPaymentCount > 0) {
                console.log(`[orders] Released ${expiredPaymentCount} expired pending payment order(s)`);
            }
            if (stalePendingPaymentCount > 0) {
                console.log(`[orders] Released ${stalePendingPaymentCount} stale pending payment order(s)`);
            }
        } catch (error) {
            console.error('[orders] Failed to run lifecycle jobs:', error);
        }
    };

    runSafely();

    const timer = setInterval(runSafely, ORDER_AUTO_COMPLETE_INTERVAL_MS);
    timer.unref?.();

    return timer;
}

module.exports = {
    autoCompleteDeliveredOrders,
    startOrderLifecycleJobs,
};
