'use strict';

let supertest = require('supertest');
let sinon = require('sinon');

describe('Number API test', function() {

    before(function() {
        process.env.API_TOKEN = 't-ec609de8-415a-4fda-ac47-7acd5ce20956';
        process.env.API_SECRET = '97cb76db-666c-47ec-9da7-422b9cfb8b63';
        process.env.USER_ID = 'u-19572bda-ee2e-45fc-bce0-2f0819da6f7d';
        process.env.APPLICATION_ID = 'u-19572bda-ee2e-45fc-bce0-2f0819da6f7d';
        process.env.MONGOLAB_URI = 'mongodb://localhost/calltracking-test';
    });

    beforeEach(function() {
        this.app = require('../app');
        this.models = require('../lib/Models');

        this.mongoose = require('mongoose');
        this.catapult = require('node-bandwidth');
        this.sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        this.sandbox.restore();
        this.models.Number.remove({}, function(err) {
            if (err) {
                throw err;
            }
        });
    });

    after(function() {
        this.mongoose.connection.db.dropDatabase();
    });

    it('should create a number', function(done) {
        this.sandbox.stub(this.catapult.AvailableNumber, 'searchLocal', function(data, callback) {
            data = [{number: '+14088833839'}];
            callback(null, data);
        });

        this.sandbox.stub(this.catapult.PhoneNumber, 'create', function(data, callback) {
            data = {number: '+14088833839'};
            callback(null, data);
        });

        supertest(this.app)
            .post('/api/v1.0/number/create')
            .set('Content-Type', 'application/json')
            .send({businessNumber: '+14088830000'})
            .expect('Content-Type', /json/)
            .expect(201)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                res.text.should.be.ok;
                let json = JSON.parse(res.text);
                let keys = Object.keys(json);
                keys.length.should.equal(9);
                [
                    '_id',
                    'businessNumber',
                    'trackingNumber',
                    'trackingDate',
                    'whisperPrompt',
                    'recordCall',
                    'playDisclaimer',
                    'status',
                    '__v'
                ].forEach((expected) => {
                    Boolean(keys.find((item) => {return item === expected;})).should.equal(true);
                });

                json.businessNumber.should.equal('+14088830000');
                json.trackingNumber.should.equal('+14088833839');
                json.whisperPrompt.should.equal('');
                json.recordCall.should.equal(true);
                json.playDisclaimer.should.equal(true);
                json.status.should.equal('activated');

                this.models.Number.find((err, model) => {
                    if (err) {
                        throw err;
                    }

                    model.length.should.equal(1);
                    model[0].businessNumber.should.equal('+14088830000');
                    model[0].trackingNumber.should.equal('+14088833839');
                    model[0].whisperPrompt.should.equal('');
                    model[0].recordCall.should.equal(true);
                    model[0].playDisclaimer.should.equal(true);
                    model[0].status.should.equal('activated');
                    done();
                });
            });
    });

    it('should modify a number', function(done) {

        this.sandbox.stub(this.catapult.AvailableNumber, 'searchLocal', function(data, callback) {
            data = [{number: '+14088833839'}];
            callback(null, data);
        });

        this.sandbox.stub(this.catapult.PhoneNumber, 'create', function(data, callback) {
            data = {number: '+14088833839'};
            callback(null, data);
        });

        let number = new this.models.Number({
            businessNumber: '+14088830000',
            trackingNumber: '+14088833839',
            trackingDate: new Date(),
            whisperPrompt: '',
            recordCall: true,
            playDisclaimer: true,
            status: 'activated'
        });

        let save = number.save((err) => {
            if (err) {
                throw err;
            }
        });

        save.then((doc) => {
            supertest(this.app)
                .patch(`/api/v1.0/number/edit/${doc._id}`)
                .set('Content-Type', 'application/json')
                .send({playDisclaimer: 'false', status: 'expired'})
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    if (err) {
                        throw err;
                    }

                    res.text.should.be.ok;
                    let json = JSON.parse(res.text);
                    let keys = Object.keys(json);
                    keys.length.should.equal(9);
                    [
                        '_id',
                        'businessNumber',
                        'trackingNumber',
                        'trackingDate',
                        'whisperPrompt',
                        'recordCall',
                        'playDisclaimer',
                        'status',
                        '__v'
                    ].forEach((expected) => {
                        Boolean(keys.find((item) => {return item === expected;})).should.equal(true);
                    });
                    json.businessNumber.should.equal('+14088830000');
                    json.trackingNumber.should.equal('+14088833839');
                    json.whisperPrompt.should.equal('');
                    json.recordCall.should.equal(true);
                    json.playDisclaimer.should.equal(false);
                    json.status.should.equal('expired');

                    this.models.Number.find((err, model) => {
                        if (err) {
                            throw err;
                        }

                        model.length.should.equal(1);
                        model[0].businessNumber.should.equal('+14088830000');
                        model[0].trackingNumber.should.equal('+14088833839');
                        model[0].whisperPrompt.should.equal('');
                        model[0].recordCall.should.equal(true);
                        model[0].playDisclaimer.should.equal(false);
                        model[0].status.should.equal('expired');
                        done();
                    });
                });
        },

        (err) => {
            throw err;
        });

    });

    it('should handle catapult AvailableNumber.searchLocal error', function(done) {
        this.sandbox.stub(this.catapult.AvailableNumber, 'searchLocal', function(data, callback) {
            callback(new Error('AvailableNumber.searchLocal error example'));
        });

        supertest(this.app)
            .post('/api/v1.0/number/create')
            .set('Content-Type', 'application/json')
            .send({businessNumber: '+14088830000'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                res.text.should.be.ok;
                let json = JSON.parse(res.text);
                let keys = Object.keys(json);
                keys.length.should.equal(1);
                keys[0].should.equal('errors');
                json.errors.length.should.equal(1);
                json.errors[0].should.equal('AvailableNumber.searchLocal error example');

                this.models.Number.find((err, model) => {
                    if (err) {
                        throw err;
                    }

                    model.length.should.equal(0);
                    done();
                });
            });
    });

    it('should return unexpected error if something wrong with order process', function(done) {
        this.sandbox.stub(this.catapult.AvailableNumber, 'searchLocal', function(data, callback) {
            data = [{number: '+14088833839'}];
            callback(null, data);
        });

        this.sandbox.stub(this.catapult.PhoneNumber, 'create', function(data, callback) {
            callback(new Error('PhoneNumber.create error example'));
        });

        supertest(this.app)
            .post('/api/v1.0/number/create')
            .set('Content-Type', 'application/json')
            .send({businessNumber: '+14088830000'})
            .expect('Content-Type', /json/)
            .expect(500)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                res.text.should.be.ok;
                let json = JSON.parse(res.text);
                let keys = Object.keys(json);
                keys.length.should.equal(1);
                keys[0].should.equal('errors');
                json.errors.length.should.equal(1);
                json.errors[0].should.equal('Unexpected error occurred');

                this.models.Number.find((err, model) => {
                    if (err) {
                        throw err;
                    }

                    model.length.should.equal(0);
                    done();
                });
            });
    });

    it('should return error if there is no number to make order', function(done) {
        this.sandbox.stub(this.catapult.AvailableNumber, 'searchLocal', function(data, callback) {
            data = [];
            callback(null, data);
        });

        supertest(this.app)
            .post('/api/v1.0/number/create')
            .set('Content-Type', 'application/json')
            .send({businessNumber: '+14088830000'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                res.text.should.be.ok;
                let json = JSON.parse(res.text);
                let keys = Object.keys(json);
                keys.length.should.equal(1);
                keys[0].should.equal('errors');
                json.errors.length.should.equal(1);
                json.errors[0].should.equal('No available number found');

                this.models.Number.find((err, model) => {
                    if (err) {
                        throw err;
                    }

                    model.length.should.equal(0);
                    done();
                });
            });
    });

    it('should return error when no required fields in request', function(done) {

        supertest(this.app)
            .post('/api/v1.0/number/create')
            .set('Content-Type', 'application/json')
            .send({})
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                res.text.should.be.ok;
                let json = JSON.parse(res.text);
                let keys = Object.keys(json);
                keys.length.should.equal(1);
                keys[0].should.equal('errors');
                json.errors.length.should.equal(1);
                json.errors[0].should.equal('Path `businessNumber` is required.');

                this.models.Number.find((err, model) => {
                    if (err) {
                        throw err;
                    }

                    model.length.should.equal(0);
                    done();
                });
            });
    });

    it('should return invalid phone format error', function(done) {

        supertest(this.app)
            .post('/api/v1.0/number/create')
            .set('Content-Type', 'application/json')
            .send({businessNumber: '14088830000'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    throw err;
                }

                res.text.should.be.ok;
                let json = JSON.parse(res.text);
                let keys = Object.keys(json);
                keys.length.should.equal(1);
                keys[0].should.equal('errors');
                json.errors.length.should.equal(1);
                json.errors[0].should.equal('14088830000: invalid phone format');

                this.models.Number.find((err, model) => {
                    if (err) {
                        throw err;
                    }

                    model.length.should.equal(0);
                    done();
                });
            });
    });
});
