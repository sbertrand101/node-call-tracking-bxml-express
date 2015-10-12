'use strict';

let config = require('config');
let xml = require('node-bandwidth').xml;

class Actions {

    /**
     * Action to make transfer to callee.
     * Generates b-xml according to Number options.
     * @param {Object}  instance of Number model to get call settings
     * @param {String} callerNumber  Caller phone number
     * @return {Promise} transfer b-xml
     */
    static transfer(instance, callerNumber) {
        if (!instance) {
            return Actions.hangup();
        }

        let response = new xml.Response();

        // Adds SpeakSentence verb with playDisclaimer so
        // caller will hear it before transfer to callee
        if (instance.playDisclaimer) {
            let options = config.sentence.options;
            options.sentence = config.sentence.text.disclaimer;
            response.push(new xml.SpeakSentence(options));
        }

        let options = {
            transferTo: instance.businessNumber,
            transferCallerId: callerNumber
        };

        // Adds SpeakSentence verb with whisperPrompt so
        // callee will hear it and then sides will be able to talk
        if (instance.whisperPrompt) {
            let sentenceOptions = config.sentence.options;
            sentenceOptions.sentence = instance.whisperPrompt;
            options.speakSentence = new xml.SpeakSentence(sentenceOptions);
        }

        if (instance.record) {
            options.record = new xml.Record(config.record.options);
        }

        response.push(new xml.Transfer(options));

        return new Promise((resolve) => {
            resolve(response.toXml());
        });
    }

    /**
     * Hangup action
     * @return {Promise} b-xml with hangup verb
     */
    static hangup() {
        let response = new xml.Response();
        let hangup = new xml.Hangup();
        response.push(hangup);

        return new Promise((resolve) => {
            resolve(response.toXml());
        });
    }
}

module.exports = Actions;
