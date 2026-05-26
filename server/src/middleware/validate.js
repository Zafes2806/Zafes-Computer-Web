const { validationResult } = require('express-validator');

const { BadRequestError } = require('../core/error.response');

function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const firstError = errors.array({ onlyFirstError: true })[0];
        return next(new BadRequestError(firstError.msg));
    }

    return next();
}

module.exports = validate;
