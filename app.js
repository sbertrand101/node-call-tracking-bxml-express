'use strict';

let bodyParser = require('body-parser');
let catapult = require('node-bandwidth');
let express = require('express');
let mongoose = require('mongoose');

let CallTrackingApi = require('./lib/CallTrackingApi');
let NumberApi = require('./lib/NumberApi');
let ImproperlyConfigured = require('./lib/Errors').ImproperlyConfigured;

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/calltracking');

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

let envCheck = [
    process.env.API_TOKEN,
    process.env.API_SECRET,
    process.env.USER_ID,
    process.env.APPLICATION_ID
].some((item) => {return !item;});

if (envCheck) {
    throw new ImproperlyConfigured('Check your environment variables to be defined');
}

catapult.Client.globalOptions.API_TOKEN = process.env.API_TOKEN;
catapult.Client.globalOptions.API_SECRET = process.env.API_SECRET;
catapult.Client.globalOptions.USER_ID = process.env.USER_ID;

let callTrackingApi = new CallTrackingApi();
let numberApi = new NumberApi();

let app = express();

app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/xml' }));

app.use('/api/v1.0', callTrackingApi.router);
app.use('/api/v1.0/number', numberApi.router);

module.exports = app;
