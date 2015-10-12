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
        this.models.CDR.remove({}, function(err) {
            if (err) {
                throw err;
            }
        });

        this.models.Number.remove({}, function(err) {
            if (err) {
                throw err;
            }
        });
    });

    after(function() {
        this.mongoose.connection.db.dropDatabase();
    });

    it('should create cdr. Test entire flow', function(done) {
        let _this = this;

        function testIncomingCall() {
            let checker = (err) => {
                if (err) {
                    throw err;
                }

                _this.models.CDR.find((err, models) => {
                    if (err) {
                        throw err;
                    }

                    models.length.should.equal(1);
                    models[0].from.should.equal('+14089155648');
                    models[0].to.should.equal('+14088833839');
                    models[0].eventOrderList[0].eventType.should.equal('incomingcall');
                    models[0].callId.should.equal('c-5zgk2l24v2kmgxq36ujhhza');

                    testAnswer();
                });
            };

            supertest(_this.app)
                .get(
                '/api/v1.0/call?' +
                'to=%2B14088833839&' +
                'time=2015-10-02T14%3A58%3A12Z&' +
                'from=%2B14089155648&' +
                'eventType=incomingcall&' +
                'callId=c-5zgk2l24v2kmgxq36ujhhza&'
            )
                .set('Content-Type', 'application/xml')
                .expect('Content-Type', /xml/)
                .expect(200)
                .end(checker);
        }

        function testAnswer() {
            let checker = (err, res) => {
                _this.models.CDR.find((err, models) => {
                    if (err) {
                        throw err;
                    }

                    res.text.should.be.ok;
                    res.text.should.equal(
                        '<?xml version="1.0"?>\n' +
                        '<Response>\n' +
                        '  <SpeakSentence voice="julie" locale="en_US" gender="female">The conversation will be recorded</SpeakSentence>\n' +
                        '  <Transfer transferTo="+14088830000" transferCallerId="+14089155648"/>\n' +
                        '</Response>'
                    );
                    models.length.should.equal(1);
                    models[0].from.should.equal('+14089155648');
                    models[0].to.should.equal('+14088833839');
                    models[0].eventOrderList[0].eventType.should.equal('incomingcall');
                    models[0].eventOrderList[1].eventType.should.equal('answer');
                    models[0].callId.should.equal('c-5zgk2l24v2kmgxq36ujhhza');

                    testHangup();
                });
            };

            supertest(_this.app)
                .get(
                '/api/v1.0/call?' +
                'to=%2B14088833839&' +
                'time=2015-10-02T14%3A58%3A12Z&' +
                'from=%2B14089155648&' +
                'eventType=answer&' +
                'callId=c-5zgk2l24v2kmgxq36ujhhza&'
            )
                .set('Content-Type', 'application/xml')
                .expect('Content-Type', /xml/)
                .expect(200)
                .end(checker);
        }

        function testHangup() {
            let checker = (err) => {
                if (err) {
                    throw err;
                }

                _this.models.CDR.find((err, models) => {
                    if (err) {
                        throw err;
                    }

                    models.length.should.equal(1);
                    models[0].from.should.equal('+14089155648');
                    models[0].to.should.equal('+14088833839');
                    models[0].eventOrderList[0].eventType.should.equal('incomingcall');
                    models[0].eventOrderList[1].eventType.should.equal('answer');
                    models[0].eventOrderList[2].eventType.should.equal('hangup');
                    models[0].callId.should.equal('c-5zgk2l24v2kmgxq36ujhhza');
                    models[0].duration.should.equal(59);

                    testRecording();
                });
            };

            supertest(_this.app)
                .get(
                '/api/v1.0/call?' +
                'to=%2B14088833839&' +
                'time=2015-10-02T14%3A59%3A11Z&' +
                'from=%2B14089155648&' +
                'eventType=hangup&' +
                'callId=c-5zgk2l24v2kmgxq36ujhhza&'
            )
                .set('Content-Type', 'application/xml')
                .expect('Content-Type', /xml/)
                .expect(200)
                .end(checker);
        }

        function testRecording() {
            let checker = (err) => {
                if (err) {
                    throw err;
                }

                _this.models.CDR.find((err, models) => {
                    if (err) {
                        throw err;
                    }

                    models.length.should.equal(1);
                    models[0].from.should.equal('+14089155648');
                    models[0].to.should.equal('+14088833839');
                    models[0].eventOrderList[0].eventType.should.equal('incomingcall');
                    models[0].eventOrderList[1].eventType.should.equal('answer');
                    models[0].eventOrderList[2].eventType.should.equal('hangup');
                    models[0].eventOrderList[3].eventType.should.equal('recording');
                    models[0].callId.should.equal('c-5zgk2l24v2kmgxq36ujhhza');
                    models[0].duration.should.equal(59);
                    models[0].recordingUri.should.equal(
                        'https://api.catapult.inetwork.com' +
                        '/v1/users/u-2qep46jwram5oyyqqa5muli/recordings/rec-7dr3ag72az2nd5ariqjpywi'
                    );
                    done();
                });
            };

            supertest(_this.app)
                .get(
                '/api/v1.0/call?' +
                'eventType=recording&' +
                'recordingUri=' +
                'https%3A%2F%2Fapi.catapult.inetwork.com' +
                '%2Fv1%2Fusers%2Fu-2qep46jwram5oyyqqa5muli%2Frecordings%2Frec-7dr3ag72az2nd5ariqjpywi&' +
                'callId=c-5zgk2l24v2kmgxq36ujhhza&'
            )
                .set('Content-Type', 'application/xml')
                .expect('Content-Type', /xml/)
                .expect(200)
                .end(checker);
        }

        let number = new this.models.Number({
            businessNumber: '+14088830000',
            trackingNumber: '+14088833839',
            trackingDate: new Date(),
            whisperPrompt: '',
            recordCall: false,
            playDisclaimer: true,
            status: 'activated'
        });

        let save = number.save((err) => {
            if (err) {
                throw err;
            }
        });

        save.then(testIncomingCall);

    });

});
