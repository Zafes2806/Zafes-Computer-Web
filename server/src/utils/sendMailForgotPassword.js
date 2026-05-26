const config = require('../config/env');
const { createEmailTransport } = require('./emailTransport');

const sendMailForgotPassword = async (email, otp) => {
    try {
        const transport = await createEmailTransport();
        await transport.sendMail({
            from: `"Zafes Computer" <${config.email.userEmail}>`,
            to: email,
            subject: 'Yêu cầu đặt lại mật khẩu',
            text: `Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là: ${otp}. Vui lòng làm theo hướng dẫn trong email.`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #e67e22;">Zafes Computer</h2>
                        <p style="color: #555; font-size: 14px;">Yêu cầu đặt lại mật khẩu của bạn</p>
                    </div>
                    <p>Xin chào <strong>${email}</strong>,</p>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    <p>Mã OTP của bạn là: <strong style="font-size: 18px; color: #e67e22;">${otp}</strong></p>
                    <p>Liên kết này sẽ hết hạn sau 5 phút.</p>
                    <p>Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi qua email <a href="mailto:${config.email.userEmail}" style="color: #3498db; text-decoration: none;">${config.email.userEmail}</a>.</p>
                    <p style="margin-top: 20px; font-size: 14px; text-align: center; color: #777;">Trân trọng,</p>
                    <p style="text-align: center; color: #e67e22; font-size: 18px;">Đội ngũ Zafes Computer</p>
                </div>
            `,
        });
    } catch (error) {
        const errorMessage = error?.message || String(error);
        console.error('sendMailForgotPassword failed', {
            email,
            errorMessage,
        });
        throw new Error('Không thể gửi email đặt lại mật khẩu.');
    }
};

module.exports = sendMailForgotPassword;
