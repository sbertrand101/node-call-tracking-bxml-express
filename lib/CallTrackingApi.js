'use strict';

require('colors');

let Actions = require('./Actions');
let BaseApi = require('./BaseApi');
let CDR = require('./Models').CDR;
let NumberModel = require('./Models').Number;

class CallTrackingApi extends BaseApi {

    constructor() {
        super();

        // Single handler to process all event types
        this.router.get('/call', this.requestHandler);
    }

    /**
     * Base request handler
     * Finds event handler by name of incoming event and invokes it
     * If there's no appropriate handler returns empty response with status 200.
     */
    get requestHandler() {
        return (req, res) => {
            this.query = req.query;
            let handler = this[this.query.eventType];
            if (handler) {
                handler = handler.call(this);
            } else {
                handler = this.processNotImplementedEvent();
            }

            handler.then((xml) => {
                return this.xmlResponse(res, 200, xml);
            }).catch((err) => {
                console.error(err);
                res.end();
            });
        };
    }

    /**
     * Incoming event handler. Creates initial cdr record or updates existing one.
     * Is used just to store eventType history
     * @return {Promise} empty string.
     */
    incomingcall() {
        let model = this.initCDR();
        return this.processResponse(model);
    }

    /**
     * Answer event handler. Creates initial cdr record or updates existing one.
     * Generates b-xml to transfer caller to business number which is taken from Number model.
     * In case if number is expired (or we cannot find by some reason) we just process a call as hangup.
     * @return {Promise} transfer b-xml
     */
    answer() {
        let cdr = this.initCDR();

        return cdr.then(
            (cdrModel) => {
                this.logQueryResult(cdrModel);
                let number = NumberModel.findOne({
                    trackingNumber: cdrModel.to,
                    status: 'activated'
                });
                return number.then((numberModel) => {
                    return Actions.transfer(numberModel, cdrModel.from);
                });
            },

            (err) => {
                console.error(err);
                return Actions.hangup();
            }
        ).catch((err) => {
            console.error(err);
            return Actions.hangup();
        });
    }

    /**
     * Recording event handler. Stores recording URI into cdr.
     * Will create new cdr record if 'recording' is the first event we received
     * @return {Promise}  empty string
     */
    recording() {
        let model = CDR.findOneAndUpdate(
            {
                callId: this.query.callId
            },
            {
                $push: {
                    eventOrderList: {
                        eventType: this.query.eventType,
                        time: new Date()
                    }
                },
                $set: {
                    recordingUri: this.query.recordingUri
                }
            },
            {
                new: true,
                upsert: true
            }
        );

        return this.processResponse(model);
    }

    /**
     * Hangup event handler. Stores end time, duration and cause into cdr
     * Will create new cdr record if 'hangup' is the first event we received
     * @return {Promise}  empty string
     */
    hangup() {
        let cdr = this.initCDR();
        let cdrUpdate = new Promise((resolve, reject) => {
            cdr.then((instance) => {
                instance.endTime = this.query.time;
                instance.duration = (new Date(instance.endTime).getTime() - new Date(instance.startTime).getTime()) / 1000;
                instance.cause = this.query.cause;
                instance.save((err, instance) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(instance);
                    }
                });
            });
        });
        return this.processResponse(cdrUpdate);
    }

    /**
     * Creates a cdr record.
     * Almost all eventHandlers are required the cdr to be created no matter
     * what order of events we receive.
     * @return {Promise}  instance of CDR model
     */
    initCDR() {
        return CDR.findOneAndUpdate(
            {
                callId: this.query.callId
            },
            {
                $push: {
                    eventOrderList: {
                        eventType: this.query.eventType,
                        time: new Date()
                    }
                },
                $setOnInsert: {
                    from: this.query.from,
                    to: this.query.to,
                    startTime: this.query.time
                }
            },
            {
                upsert: true,
                new: true
            }
        );
    }

    /**
     * Is used if no handler implemented for event processing
     * @return {Promise}  empty string
     */
    processNotImplementedEvent() {
        return this.processData().then(
            (data) => {
                return this.processResponse(data);
            },

            (err) => {
                console.error(err);
                throw err;
            }
        );
    }

    /**
     * Is used in those handlers where we need store only event history
     * @return {Promise}  instance of CDR model
     */
    processData() {
        return CDR.findOneAndUpdate(
            {
                callId: this.query.callId
            },
            {
                $push: {
                    eventOrderList: {
                        eventType: this.query.eventType,
                        time: new Date()
                    }
                }
            },
            {
                new: true,
                select: {_id: 0, __v: 0}
            }
        );
    }

    /**
     * Is used in those handlers where we need return empty response body
     * @return {Promise}  instance of CDR model
     */
    processResponse(promise) {
        return promise.then(
            (model) => {
                this.logQueryResult(model);
                return '';
            },

            (err) => {
                console.error(err);
                return '';
            }
        ).catch((err) => {
            console.error(err);
            return '';
        });
    }

    logQueryResult(cdr) {
        console.log(`Mongoose ${this.query.eventType} CDR`.cyan, JSON.stringify(cdr, null, 2));
    }
}

module.exports = CallTrackingApi;
