var should = require('should'),
    fs = require('fs'),
    rimraf = require('rimraf');

var ngbuild = require('../index');
var test = require('../lib/test');

beforeEach(function (done) {
    rimraf('tmp', function () {
        fs.mkdir('tmp',done);
    });
});

describe('Scripts concat', function () {
    it('Insert of one file', function (done) {
        ngbuild.build({
            src: 'app/simple_app.js',
            dest: 'tmp/simple_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/simple_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/simple_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Insert of folder', function (done) {
        ngbuild.build({
            src: 'app/controllers_app.js',
            dest: 'tmp/controllers_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/controllers_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/controllers_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Insert directives with templates', function (done) {
        ngbuild.build({
            src: 'app/template_directive_app.js',
            dest: 'tmp/template_directive_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/template_directive_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/template_directive_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Insert directives with styles', function (done) {
        ngbuild.build({
            src: 'app/styles_directive_app.js',
            dest: 'tmp/styles_directive_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/styles_directive_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/styles_directive_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Insert directives with template and styles', function (done) {

        ngbuild.build({
            src: 'app/template_and_styles_directive_app.js',
            dest: 'tmp/template_and_styles_directive_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/template_and_styles_directive_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/template_and_styles_directive_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('App with simple module', function (done) {
        ngbuild.build({
            src: 'app/full_app.js',
            dest: 'tmp/full_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/full_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/full_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Build without dublicates', function (done) {
        ngbuild.build({
            src: 'app/dublicates_app.js',
            dest: 'tmp/dublicates_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/dublicates_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/dublicates_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Build with lib', function (done) {
        ngbuild.build({
            src: 'app/lib_app.js',
            dest: 'tmp/lib_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/lib_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/lib_app.js');
                    done();
                });
            }, 100);
        });

    });

    it('Build app with routes', function (done) {
        ngbuild.build({
            src: 'app/router_app.js',
            dest: 'tmp/router_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/router_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/router_app.js');
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

        var writable = new CustomWritable();

        var readable = ngbuild.getReadable({
            content: content,
            src: 'app/simple_app.js'
        })
        readable.on('end', function () {
            test.expect(writeResult, 'expected/simple_app.js');
            done()
        });
        readable.pipe(writable);
    });

    it('Should build app with relative paths', function (done) {
        ngbuild.build({
            src: 'app/module_app.js',
            dest: 'tmp/module_app.js'
        }).on('end', function () {
            setTimeout(function () {
                fs.readFile('tmp/module_app.js', 'utf-8', function (err, file) {
                    if (err)return done(err);
                    test.expect(file, 'expected/module_app.js');
                    done();
                });
            }, 100);
        });
    });

});

describe('Scripts concat in sync mode', function () {
    it('Insert of one file', function () {
        var result = ngbuild.buildSync({
            src: 'app/simple_app.js'
        });

        test.expect(result, 'expected/simple_app.js');
    });

    it('Insert of folder', function () {
        var result = ngbuild.buildSync({
            src: 'app/controllers_app.js'
        });

        test.expect(result, 'expected/controllers_app.js');
    });

    it('Insert directives with templates', function () {
        var result = ngbuild.buildSync({
            src: 'app/template_directive_app.js'
        });

        test.expect(result, 'expected/template_directive_app.js');
    });

    it('Insert directives with styles', function () {
        var result = ngbuild.buildSync({
            src: 'app/styles_directive_app.js'
        });

        test.expect(result, 'expected/styles_directive_app.js');
    });

    it('Insert directives with template and styles', function () {
        var result = ngbuild.buildSync({
            src: 'app/template_and_styles_directive_app.js'
        });

        test.expect(result, 'expected/template_and_styles_directive_app.js');
    });

    it('App with simple module', function () {
        var result = ngbuild.buildSync({
            src: 'app/full_app.js'
        });

        test.expect(result, 'expected/full_app.js');
    });

    it('Build without dublicates', function () {
        var result = ngbuild.buildSync({
            src: 'app/dublicates_app.js'
        });

        test.expect(result, 'expected/dublicates_app.js');
    });

    it('Build with lib', function () {
        var result = ngbuild.buildSync({
            src: 'app/lib_app.js'
        });

        test.expect(result, 'expected/lib_app.js');
    });

    it('Build app with routes', function () {
        var result = ngbuild.buildSync({
            src: 'app/router_app.js'
        });

        test.expect(result, 'expected/router_app.js');
    });

    it('Should build app with relative paths', function () {
        var result = ngbuild.buildSync({
            src: 'app/module_app.js'
        });

        test.expect(result, 'expected/module_app.js');
    });
});