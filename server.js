'use strict';

let http = require('http');

let app = require('./app');
let server = http.createServer(app);

/**
* Start the server
* @param  {Function} callback
*/
module.exports.start = function(callback) {
    server.listen(app.get('port'), function() {
        module.exports.running = true;
        console.log('Server running at http://0.0.0.0:' + app.get('port'));
        if (callback) {
            callback();
        }
    });
};

/**
* Stop the server
* @param  {Function} callback
*/
module.exports.stop = function(callback) {
    server.close(function() {
        module.exports.running = false;
        console.log('Server stopped');
        if (callback) {
            callback();
        }
    });
};

module.exports.running = false;

module.exports.start();
