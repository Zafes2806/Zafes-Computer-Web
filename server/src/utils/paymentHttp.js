const paymentService = require('../services/payment.service');

function sendMomoCallbackResponse(req, res, outcome, orderCode = '') {
    const response = paymentService.buildMomoCallbackResponse({
        method: req.method,
        outcome,
        orderCode,
    });

    if (response.type === 'empty') {
        return res.status(response.statusCode).send();
    }

    if (response.type === 'json') {
        return res.status(response.statusCode).json(response.body);
    }

    return res.redirect(response.location);
}

module.exports = {
    sendMomoCallbackResponse,
};
