'use strict';

let BaseApi = require('./BaseApi');
let NumberModel = require('./Models').Number;
let catapult = require('node-bandwidth');

let CatapultApiError = require('./Errors').CatapultApiError;

class NumberApi extends BaseApi {

    constructor() {
        super();
        this.router.post('/create', this.create());
        this.router.patch('/edit/:id', this.edit());
    }

    /**
     * Creates new document.
     * When the document is created returns 201 and the documnet
     * @return {Promise} json resonse
     */
    create() {
        return (req, res) => {
            let model = new NumberModel(req.body);

            let errors = model.validateSync();
            if (errors) {
                this.handleError(res, errors);
                return;
            }

            let findAvailableNumber = (areaCode) => {
                return new Promise((resolve, reject) => {
                    let data = {
                        areaCode: areaCode,
                        quantity: 1
                    };
                    catapult.AvailableNumber.searchLocal(data, (err, numbers) => {
                        if (err) {
                            reject(new CatapultApiError(err.message));
                        } else {
                            let trackingNumber = numbers.pop();
                            if (trackingNumber) {
                                resolve(trackingNumber.number);
                            } else {
                                reject(new CatapultApiError('No available number found'));
                            }
                        }
                    });
                });
            };

            let orderNumber = (number) => {
                return new Promise((resolve, reject) => {
                    let data = {
                        number: number,
                        applicationId: process.env.APPLICATION_ID
                    };
                    catapult.PhoneNumber.create(data, (err, phoneNumber) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(phoneNumber.number);
                        }
                    });
                });
            };

            let availableNumber = findAvailableNumber(model.businessNumber.slice(2, 5));
            let order = availableNumber.then((number) => {
                return orderNumber(number);
            });

            let saveModel = order.then((number) => {
                model.trackingNumber = number;
                model.trackingDate = new Date();
                return model.save((err) => {
                    if (err) {
                        throw err;
                    }
                });
            });
            saveModel.then((model) => {
                this.jsonResponse(res, 201, model);
            }).catch((err) => {
                this.handleError(res, err);
            });
        };
    }

    /**
     * Updates document by id.
     * If document is modified returns 200 and the documnet
     * If have nothing to modify returns 204 and empty content
     * @return {Promise} json response
     */
    edit() {
        return (req, res) => {
            let model = NumberModel.update(
                {_id: req.params.id},
                {$set: req.body},
                {runValidators: true}
            );
            model.then(
                (info) => {
                    if (info.nModified) {
                        let query = NumberModel.findOne({_id: req.params.id});

                        query.then(
                            (data) => {
                                this.jsonResponse(res, 200, data);
                            },

                            (err) => {
                                this.handleError(res, err);
                            }
                        );
                    } else {
                        this.jsonResponse(res, 204);
                    }
                },

                (err) => {
                    this.handleError(res, err);
                }
            );
        };
    }
}

module.exports = NumberApi;
