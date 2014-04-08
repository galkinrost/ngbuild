module.exports = (function () {

    var fs = require('fs-extra');
    var path = require('path');

    var _ = require('underscore');
    var async = require('async');

    var esprima = require('esprima');
    var escodegen = require('escodegen');

    var astra = require('astra');
    var Readable = require('stream').Readable;
    var util = require('util');

    var Builder = function (setting, opt) {
        Readable.call(this, opt);

        if ('undefined' === typeof setting)throw Error('Missing settings argument');
        if ('undefined' === typeof setting.src)throw Error('Missing src parameter');

        this.content = setting.content;

        this.moduleFilename = ('undefined' === typeof setting.moduleFilename ? 'module.js' : setting.moduleFilename);

        this.files = {};

        this.deep = 0;

        this.src = setting.src;
        this.dest = setting.dest;

        this.isInited = false;

        this.modulePattern = {
            type: 'CallExpression',
            callee: { type: 'MemberExpression',
                object: { type: 'Identifier', name: 'angular' },
                property: { type: 'Identifier', name: 'module' }
            },
            arguments: [
                { type: 'Literal'},
                { type: 'ArrayExpression' }
            ]
        };

        this.directivePattern = {
            type: 'CallExpression',
            callee: { type: 'MemberExpression',
                object: { type: 'CallExpression'},
                property: { type: 'Identifier', name: 'directive' }
            }
        };

        this.routePattern = {
            "type": "FunctionExpression",
            "params": [
                {
                    "type": "Identifier",
                    "name": "$routeProvider"
                }
            ],
            '**': {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",
                    "property": {
                        "type": "Identifier",
                        "name": "when"
                    }
                }
            }
        };

    }

    util.inherits(Builder, Readable);

    Builder.prototype.isLibraryPath = function (path) {
        return /^!\//.test(path);
    }

    Builder.prototype.isModulePath = function (path) {
        return /^\//.test(path);
    }

    Builder.prototype.createStyleTag = function (styles) {
        return '<style>' + styles + '</style>'
    }

    Builder.prototype.createTemplateAst = function (content) {
        content = 'undefined' === typeof content ? '' : content;
        return { type: 'Property',
            key: { type: 'Identifier', name: 'template' },
            value: { type: 'Literal',
                value: content,
                kind: 'init' }
        }
    }

    Builder.prototype.createDependecyAst = function (name) {
        return {
            type: 'Literal',
            value: name
        }
    }

    Builder.prototype.isDirectory = function (filepath) {
        if (/^\//.test(filepath)) {
            filepath = filepath.slice(1);
        }

        return fs.lstatSync(filepath).isDirectory()
    }

    Builder.prototype.readDirectory = function (modulepath, moduleFilename, done) {
        var self = this;

        if (/^\//.test(modulepath)) {
            modulepath = modulepath.slice(1);
        }

        async.waterfall([
            function (next) {
                fs.readdir(modulepath, next);
            },
            function (files) {
                async.map(files, function (filename, done) {
                    self.readFile(path.join(modulepath, filename), done);
                }, function (err, results) {
                    if (err)return done(err);
                    var contents = [];
                    for (var i in results) {
                        if (files[i] === moduleFilename) {
                            contents.unshift(results[i]);
                        } else {
                            contents.push(results[i]);
                        }
                    }

                    done(null, contents.join('\n'));
                });
            }
        ], done);
    }

    Builder.prototype.readFile = function (src, done) {
        if (/^\//.test(src)) {
            src = src.slice(1);
        }
        return fs.readFile(src, 'utf8', done);
    }

    Builder.prototype.work = function (content, filepath, parents, done) {
        parents = ('undefined' === typeof parents ? [] : parents);

        var self = this;
        this.deep++;

        async.waterfall([
            function () {
                var names = [];

                var ast = esprima.parse(content);

                astra(ast, true)
                    .when([
                        self.directivePattern,
                        self.routePattern
                    ], function (chunk, done) {
                        var objAst;

                        if (!chunk.arguments[1])return done();

                        if (chunk.arguments[1].type !== 'ObjectExpression') {
                            if ('undefined' === typeof chunk.arguments[1])throw Error('Syntax error in' + filepath)

                            var funcAst;

                            if (chunk.arguments[1].type === 'FunctionExpression') {
                                funcAst = chunk.arguments[1];
                            } else if (chunk.arguments[1].type === 'ArrayExpression') {
                                funcAst = _.last(chunk.arguments[1].elements)
                            } else {
                                return;
                            }

                            if (funcAst.body.body[0].argument.type !== 'ObjectExpression')return done();

                            objAst = funcAst.body.body[0].argument;
                        } else {
                            objAst = chunk.arguments[1];
                        }

                        var astTemplate = null,
                            template = null,
                            styles = null;
                        for (var i in objAst.properties) {
                            var property = objAst.properties[i];
                            if (property.key.name === 'template' && self.isModulePath(property.value.value)) {
                                astTemplate = property;
                                template = property.value.value;
                            } else if (property.key.name === 'styles' && self.isModulePath(property.value.value)) {
                                styles = property.value.value;
                                objAst.properties.splice(i, 1);
                            }
                        }

                        async.parallel([
                            function (done) {
                                if (template === null)return done(null, '');
                                self.readFile(template, done);
                            },
                            function (done) {
                                if (styles === null)return done(null, '');
                                self.readFile(styles, done);
                            }
                        ], function (err, results) {
                            if (err) return done(err);
                            var template = results[0];
                            var styles = results[1] === '' ? '' : self.createStyleTag(results[1]);

                            if (astTemplate === null) {
                                if (template !== '' || styles !== '') {
                                    astTemplate = self.createTemplateAst(styles + template);
                                    objAst.properties.push(astTemplate);
                                }
                            } else {
                                astTemplate.value.value = styles + template;
                            }
                            done();
                        });

                    })
                    .when(self.modulePattern, function (chunk, done) {
                        names.push(chunk.arguments[0].value);
                        var elements = [];
                        var _parents = parents.slice(0);
                        _parents.push(filepath);

                        if (chunk.arguments[1].elements.length === 0) {
                            return done();
                        }

                        async.map(chunk.arguments[1].elements, function (element, done) {
                            var _filepath = element.value;

                            if (self.isLibraryPath(_filepath)) {
                                if (self.files.hasOwnProperty(_filepath))return done();
                                self.readFile(_filepath.slice(2), function (err, content) {
                                    if (err)return done(err);
                                    self.push(content + '\n');
                                    self.files[_filepath] = {};
                                    done();
                                });
                            } else if (self.isModulePath(_filepath)) {

                                _filepath = _filepath.substring(1);

                                if (~_parents.indexOf(_filepath))throw Error('circular dependecies from ' + _filepath)

                                if (self.files.hasOwnProperty(_filepath)) {
                                    self.files[_filepath].forEach(function (name) {
                                        elements.push(self.createDependecyAst(name));
                                    });
                                    done();
                                } else {
                                    var next = function (err, content) {
                                        if (err)return done(err);
                                        self.work(content, _filepath, _parents, function (err, result) {
                                            if (err)return done(err);
                                            result.names.forEach(function (name) {
                                                elements.push(self.createDependecyAst(name));
                                            });
                                            done();
                                        });
                                    }

                                    if (self.isDirectory(_filepath)) {
                                        self.readDirectory(_filepath, self.moduleFilename, next)
                                    } else {
                                        self.readFile(_filepath, next);
                                    }
                                }
                            } else {
                                elements.push(element);
                                done();
                            }
                        }, function (err) {
                            if (err)return done(err);
                            chunk.arguments[1].elements = elements;
                            done();
                        });
                    })
                    .run(function (err, newAst) {
                        if (err) {
                            if ('function' === typeof done) {
                                return done(err);
                            } else {
                                throw err;
                            }
                        }

                        if (!self.files.hasOwnProperty('/' + filepath)) {
                            var buffer = new Buffer(escodegen.generate(newAst) + '\n', 'utf-8');

                            self.push(buffer);
                            self.files['/' + filepath] = names;
                        }

                        self.deep--;

                        if (self.deep === 0)self.push(null);

                        if ('function' === typeof done)
                            done(null, {
                                names: names
                            });
                    });
            }], done);

    }

    Builder.prototype.write = function () {
        if (!this.dest)throw Error('Missing dest parameter');

        var writeStream = fs.createWriteStream(this.dest, {encoding: 'utf-8'});
        this.pipe(writeStream);
        return this;
    }

    Builder.prototype.init = function () {
        if (this.content) {
            this.work(this.content, this.src);
        } else {
            var self = this;
            var next = function (err, content) {
                if (err)throw err;
                self.work(content, self.src);
            }

            if (this.isDirectory(this.src)) {
                this.readDirectory(this.src, this.moduleFilename, next)
            } else {
                this.readFile(this.src, next);
            }
        }
    }

    Builder.prototype._read = function () {
        if (this.isInited)return;
        this.isInited = true;
        this.init();
    }

    return {
        Ngbuild: Builder,
        build: function (setting) {
            var builder = new Builder(setting);
            return builder.write();
        },
        getReadable: function (setting) {
            return new Builder(setting);
        }
    };

})();

