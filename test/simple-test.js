var should = require('should');
var ngbuild = require('../lib/ngbuild');
var fs = require('fs');

describe('Scripts concat', function () {
    it('Insert of one file', function (done) {
        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App', ['App.controllers']);\n";

        ngbuild.build({
            src: 'app/simple_app.js',
            dest: 'app/simple_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/simple_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Insert of folder', function (done) {
        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App.controllers').controller('AppFirstCtrl', function () {\n});\n" +
            "angular.module('App.controllers').controller('AppSecondCtrl', function () {\n});\n" +
            "angular.module('App', ['App.controllers']);\n"

        ngbuild.build({
            src: 'app/controllers_app.js',
            dest: 'app/controllers_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/controllers_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Insert directives with templates', function (done) {
        var result = "angular.module('App.directivesWithTemplate', []).directive('AppDirectiveWithTemplate', function () {\n" +
            "    return { template: '<span>templates/directives/template.html</span>' };\n" +
            "});\n" +
            "angular.module('App', ['App.directivesWithTemplate']);\n"

        ngbuild.build({
            src: 'app/template_directive_app.js',
            dest: 'app/template_directive_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/template_directive_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Insert directives with styles', function (done) {
        var result = "angular.module('App.directivesWithStyles', []).directive('AppDirectiveWithStyles', function () {\n" +
            "    return { template: '<style>.directive {\\n}</style>' };\n});\n" +
            "angular.module('App', ['App.directivesWithStyles']);\n"

        ngbuild.build({
            src: 'app/styles_directive_app.js',
            dest: 'app/styles_directive_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/styles_directive_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Insert directives with template and styles', function (done) {
        var result = "angular.module('App.directivesWithTemplateAndStyles', []).directive('AppDirectiveWithTemplateAndStyles', function () {\n" +
            "    return { template: '<style>.directive {\\n}</style><span>templates/directives/template.html</span>' };\n});\n" +
            "angular.module('App', ['App.directivesWithTemplateAndStyles']);\n"

        ngbuild.build({
            src: 'app/template_and_styles_directive_app.js',
            dest: 'app/template_and_styles_directive_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/template_and_styles_directive_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('App with simple module', function (done) {
        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App.controllers').controller('AppFirstCtrl', function () {\n});\n" +
            "angular.module('App.controllers').controller('AppSecondCtrl', function () {\n});\n" +
            "angular.module('App', [\n    'NgRoute',\n    'App.controllers'\n]);\n"

        ngbuild.build({
            src: 'app/full_app.js',
            dest: 'app/full_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/full_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Build without dublicates', function (done) {
        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App.controllers').controller('AppFirstCtrl', function () {\n});\n" +
            "angular.module('App.controllers').controller('AppSecondCtrl', function () {\n});\n" +
            "angular.module('App.directivesWithControllers', ['App.controllers']).directive('AppDirectiveWithControllers', function () {\n" +
            "    return {};\n});\n" +
            "angular.module('App', [\n    'App.controllers',\n    'App.directivesWithControllers'\n]);\n"

        ngbuild.build({
            src: 'app/dublicates_app.js',
            dest: 'app/dublicates_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/dublicates_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Build with lib', function (done) {
        var result = "(function () {\n" +
            "    console.log('Hello lib!');\n" +
            "})();\n" +
            "angular.module('App.directivesWithLib', []).directive('AppDirectiveWithLib', function () {\n" +
            "    return {};\n});\n" +
            "angular.module('App', ['App.directivesWithLib']);\n"

        ngbuild.build({
            src: 'app/lib_app.js',
            dest: 'app/lib_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/lib_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });

    });

    it('Build app with routes', function (done) {
        var result = "angular.module('App', ['ngRoute'], function ($routeProvider) {\n" +
            "    $routeProvider.when('/url/1', { template: '<style>.styles{\\n\\n}</style><span>templates/template.html</span>' }).when('/url/2', { template: '<style>.styles{\\n\\n}</style><span>templates/template.html</span>' });\n" +
            "});\n"

        ngbuild.build({
            src: 'app/router_app.js',
            dest: 'app/router_app.build.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('app/router_app.build.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    file.should.be.equal(result);
                    done();
                });
            }, 100);
        });
    });

    it('Building with custom writable stream', function (done) {
        var content = fs.readFileSync('app/simple_app.js');
        var writeResult = '';
        var Writable = require('stream').Writable;
        var CustomWritable = function () {
            Writable.call(this);
        }

        require('util').inherits(CustomWritable, Writable);

        CustomWritable.prototype._write = function (chunk, encoding, done) {
            writeResult += chunk.toString();
            done();
        }

        var result = "angular.module('App.controllers', []);\n" +
            "angular.module('App', ['App.controllers']);\n"
        var writable = new CustomWritable();

        var readable = ngbuild.getReadable({
            content: content,
            src: 'app/simple_app.js'
        })
        readable.on('end', function () {
            writeResult.should.be.equal(result);
            done()
        });
        readable.pipe(writable);

    });
});