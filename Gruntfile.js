'use strict';

module.exports = function(grunt) {

    let sourceFiles = ['*.js', 'lib/**/*.js', 'test/**/*.js'];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            src: sourceFiles,
            options: {
                jshintrc: true
            }
        },
        jscs: {
            src: sourceFiles,
            options: {
                config: '.jscsrc',
                verbose: true
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    require: ['should']
                },
                src: ['test/**/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', ['jshint', 'jscs', 'mochaTest']);
};
