'use strict';

class BaseError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor.name);
    }
}

class CatapultApiError extends BaseError {
    constructor(message) {
        super(message);
    }
}

class ImproperlyConfigured extends BaseError {
    constructor(message) {
        super(message);
    }
}

module.exports = {
    CatapultApiError: CatapultApiError,
    ImproperlyConfigured: ImproperlyConfigured,
};
