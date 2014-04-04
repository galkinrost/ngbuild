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

    this.moduleFilename = ('undefined' === typeof setting.moduleFilename ? 'module.js' : setting.moduleFilename);

    this.count = 0;

    this.src = setting.src;

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

}

util.inherits(Builder, Readable);

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

Builder.prototype.build = function (filepath, parents, done) {
    parents = ('undefined' === typeof parents ? [] : parents);

    var self = this;
    this.count++;

    async.waterfall([
        function (next) {
            self.isDirectory(filepath) ? self.readDirectory(filepath, self.moduleFilename, next) : self.readFile(filepath, next);
        }, function (text) {
            var names = [];

            var ast = esprima.parse(text);

            var newAst = astra(ast, true)
                .when(self.directivePattern, function (chunk, done) {
                    var funcAst;

                    if ('undefined' === typeof chunk.arguments[1])throw Error('Syntax error in' + filepath)

                    if (chunk.arguments[1].type === 'FunctionExpression') {
                        funcAst = chunk.arguments[1];
                    } else if (chunk.arguments[1].type === 'ArrayExpression') {
                        funcAst = _.last(chunk.arguments[1].elements)
                    } else {
                        return;
                    }

                    if (funcAst.body.body[0].argument.type !== 'ObjectExpression')return;

                    var astTemplate = null,
                        template = null,
                        styles = null;
                    for (var i in funcAst.body.body[0].argument.properties) {
                        var property = funcAst.body.body[0].argument.properties[i];
                        if (property.key.name === 'template' && self.isModulePath(property.value.value)) {
                            astTemplate = property;
                            template = property.value.value;
                        } else if (property.key.name === 'styles' && self.isModulePath(property.value.value)) {
                            styles = property.value.value;
                            funcAst.body.body[0].argument.properties.splice(i, 1);
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
                            astTemplate = self.createTemplateAst(styles + template);
                            funcAst.body.body[0].argument.properties.push(astTemplate);
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

                    for (var i in chunk.arguments[1].elements) {
                        var _filepath = chunk.arguments[1].elements[i].value;

                        if (self.isModulePath(_filepath)) {

                            _filepath = _filepath.substring(1);

                            if (~_parents.indexOf(_filepath))throw Error('circular dependecies from ' + _filepath)

                            self.build(_filepath, _parents, function (err, result) {
                                if (err)return done(err);
                                result.names.forEach(function (name) {
                                    elements.push(self.createDependecyAst(name));
                                });
                                chunk.arguments[1].elements = elements;
                                done();
                            });

                        } else {
                            elements.push(chunk.arguments[1].elements[i]);
                            chunk.arguments[1].elements = elements;
                            done();
                        }
                    }
                })
                .run(function (err, newAst) {
                    if (err) {
                        if ('function' === typeof done) {
                            return done(err);
                        } else {
                            throw err;
                        }
                    }

                    var buffer = new Buffer(escodegen.generate(newAst) + '\n', 'utf-8');

                    self.push(buffer);

                    self.count--;

                    if (self.count === 0)self.push(null);

                    if ('function' === typeof done)
                        done(null, {
                            names: names
                        });
                });
        }], done);

}

Builder.prototype._read = function () {
    if (this.isInited)return;
    this.isInited = true;
    this.build(this.src);
}


module.exports = function (setting) {
    if ('undefined' === typeof setting.dest)throw Error('Missing dest parameter');

    var builder = new Builder(setting);

    var writeStream = fs.createWriteStream(setting.dest, {encoding: 'utf-8'});
    builder.pipe(writeStream);

    return builder;
};

