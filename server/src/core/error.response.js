'use strict';

const HTTP_STATUS = Object.freeze({
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
});

class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message = 'Conflict', statusCode = HTTP_STATUS.CONFLICT) {
        super(message, statusCode);
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = 'Bad Request', statusCode = HTTP_STATUS.BAD_REQUEST) {
        super(message, statusCode);
    }
}

class BadUserRequestError extends ErrorResponse {
    constructor(message = 'Unauthorized', statusCode = HTTP_STATUS.UNAUTHORIZED) {
        super(message, statusCode);
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = 'Forbidden', statusCode = HTTP_STATUS.FORBIDDEN) {
        super(message, statusCode);
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = 'Not Found', statusCode = HTTP_STATUS.NOT_FOUND) {
        super(message, statusCode);
    }
}

module.exports = {
    ErrorResponse,
    ConflictRequestError,
    BadRequestError,
    BadUserRequestError,
    ForbiddenError,
    NotFoundError,
};
