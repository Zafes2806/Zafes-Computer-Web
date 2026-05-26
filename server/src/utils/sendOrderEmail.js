const config = require('../config/env');
const { createEmailTransport } = require('./emailTransport');

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function getPaymentMethodLabel(paymentMethod) {
    const labels = {
        COD: 'Thanh toán khi nhận hàng',
        MOMO: 'Thanh toán qua MoMo',
        VNPAY: 'Thanh toán qua VNPay',
    };

    return labels[paymentMethod] || paymentMethod;
}

function buildProductRows(products = []) {
    if (!Array.isArray(products) || !products.length) {
        return '';
    }

    return products.map((product) => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <div style="font-weight: 600; color: #1f2937;">${escapeHtml(product.name)}</div>
                <div style="font-size: 13px; color: #6b7280;">Số lượng: ${escapeHtml(product.quantity)}</div>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; white-space: nowrap;">
                ${formatCurrency(product.lineTotal || Number(product.unitPrice || product.price || 0) * Number(product.quantity || 0))}
            </td>
        </tr>
    `).join('');
}

function buildActionBlock({ order, accessUrl }) {
    if (!accessUrl) return '';

    const isPendingPayment = order.status === 'pending_payment';
    const buttonText = isPendingPayment ? 'Tiếp tục thanh toán' : 'Xem chi tiết đơn hàng';
    const description = isPendingPayment
        ? 'Bạn có thể dùng nút bên dưới để mở lại đơn hàng và tạo lại mã thanh toán nếu mã cũ hết hạn.'
        : 'Bạn có thể dùng nút bên dưới để xem lại thông tin đơn hàng.';

    return `
        <p style="margin: 18px 0 10px; color: #4b5563;">${description}</p>
        <p style="margin: 18px 0;">
            <a href="${escapeHtml(accessUrl)}" style="display: inline-block; background: #1677ff; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 6px; font-weight: 600;">
                ${buttonText}
            </a>
        </p>
        <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${escapeHtml(accessUrl)}</p>
    `;
}

function buildOrderEmailContent({ order, accessUrl }) {
    const isPendingPayment = order.status === 'pending_payment';
    const title = isPendingPayment ? 'Đơn hàng đang chờ thanh toán' : 'Xác nhận đơn hàng';
    const intro = isPendingPayment
        ? 'Đơn hàng của bạn đã được tạo và đang chờ thanh toán.'
        : 'Cảm ơn bạn đã đặt hàng tại Zafes Computer. Đơn hàng của bạn đang chờ xác nhận.';

    const productRows = buildProductRows(order.products);
    const productTable = productRows
        ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                <tbody>${productRows}</tbody>
            </table>
        `
        : '';

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; background-color: #ffffff;">
            <h2 style="margin: 0 0 8px; color: #1677ff;">${title}</h2>
            <p style="margin: 0 0 18px; color: #4b5563;">${intro}</p>

            <div style="background: #f9fafb; border: 1px solid #eef2f7; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px;"><strong>Mã đơn hàng:</strong> ${escapeHtml(order.orderCode)}</p>
                <p style="margin: 0 0 8px;"><strong>Người nhận:</strong> ${escapeHtml(order.fullName)}</p>
                <p style="margin: 0 0 8px;"><strong>Số điện thoại:</strong> ${escapeHtml(order.phone)}</p>
                <p style="margin: 0 0 8px;"><strong>Địa chỉ:</strong> ${escapeHtml(order.address)}</p>
                <p style="margin: 0;"><strong>Phương thức thanh toán:</strong> ${escapeHtml(getPaymentMethodLabel(order.paymentMethod))}</p>
            </div>

            ${productTable}

            <p style="margin: 18px 0 0; font-size: 18px; font-weight: 700; text-align: right;">
                Tổng tiền: <span style="color: #ef4444;">${formatCurrency(order.totalPrice)}</span>
            </p>

            ${buildActionBlock({ order, accessUrl })}

            <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
                Nếu bạn không thực hiện đơn hàng này, vui lòng bỏ qua email hoặc liên hệ ${escapeHtml(config.email.userEmail || 'Zafes Computer')}.
            </p>
        </div>
    `;
}

async function sendOrderEmail({ to, order, accessUrl }) {
    const transport = await createEmailTransport();
    const subject = order.status === 'pending_payment'
        ? `Tiếp tục thanh toán đơn hàng ${order.orderCode}`
        : `Xác nhận đơn hàng ${order.orderCode}`;

    await transport.sendMail({
        from: `"Zafes Computer" <${config.email.userEmail}>`,
        to,
        subject,
        text: `${subject}\nMã đơn hàng: ${order.orderCode}\nTổng tiền: ${formatCurrency(order.totalPrice)}\n${accessUrl || ''}`,
        html: buildOrderEmailContent({ order, accessUrl }),
    });
}

module.exports = sendOrderEmail;
