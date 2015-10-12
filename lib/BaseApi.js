'use strict';

let express = require('express');

class BaseApi {

    constructor() {
        this.router = express.Router();
    }

    xmlResponse(res, status, body) {
        res.setHeader('Content-Type', 'application/xml');
        res.status(status || 200);
        res.send(body);
    }

    jsonResponse(res, status, body) {
        res.setHeader('Content-Type', 'application/json');
        res.status(status || 200);
        res.send(JSON.stringify(body));
    }

    jsonErrorResponse(res, status, body) {
        res.setHeader('Content-Type', 'application/json');
        res.status(status || 500);
        res.send(JSON.stringify(body || {errors: ['Unexpected error occurred']}));
    }

    handleError(res, err) {
        switch (err.name) {
            case 'ValidationError':
                let errors = [];
                for (let field in err.errors) {
                    if (err.errors.hasOwnProperty(field)) {
                        errors.push(err.errors[field].message);
                    }
                }

                this.jsonErrorResponse(res, 400, {errors: errors});
                break;
            case 'CatapultApiError':
                this.jsonErrorResponse(res, 400, {errors: [err.message]});
                break;
            case 'ImproperlyConfigured':
                this.jsonErrorResponse(res);
                break;
            default:
                this.jsonErrorResponse(res);
                break;
        }
    }
}

module.exports = BaseApi;
