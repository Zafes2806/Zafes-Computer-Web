'use strict';

const HTTP_STATUS = Object.freeze({
    OK: 200,
    CREATED: 201,
});

class SuccessResponse {
    constructor({
        message,
        statusCode = HTTP_STATUS.OK,
        defaultMessage = 'OK',
        metadata = {},
        pagination,
    }) {
        this.message = message || defaultMessage;
        this.statusCode = statusCode;
        this.metadata = metadata;
        if (pagination !== undefined) {
            this.pagination = pagination;
        }
    }

    send(res, header = {}) {
        return res.status(this.statusCode).json(this);
    }
}

class OK extends SuccessResponse {
    constructor({ message, statusCode = HTTP_STATUS.OK, metadata, pagination }) {
        super({ message, statusCode, defaultMessage: 'OK', metadata, pagination });
    }
}

class Created extends SuccessResponse {
    constructor({
        message,
        statusCode = HTTP_STATUS.CREATED,
        metadata,
        pagination,
    }) {
        super({ message, statusCode, defaultMessage: 'Created', metadata, pagination });
    }
}

module.exports = {
    OK,
    Created,
};
