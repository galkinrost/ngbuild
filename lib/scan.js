exports.scan = scan;

exports.scanSync = scanSync;

var astra = require('astra'),
    Emitter = require('events').EventEmitter,
    path = require('path');

var patterns = require('./patterns');
var helpers = require('./helpers');

function scan(params, done) {
    var content = params.content;
    var filepath = params.filepath;
    var parents = params.parents;
    var files = params.files;
    var module = params.module;
    var emitter = params._emitter;

    if (!content) {
        done(new Error('Content requires'));
    }

    if (!filepath) {
        done(new Error('Filepath requires'));
    }

    parents = !parents ? [] : parents;

    files = !files ? {} : files;

    emitter = !emitter ? new Emitter : emitter;

    var names = [];

    var ast = helpers.parse(content);

    astra(ast, true)
        .when([
            patterns.directive,
            patterns.route
        ], function (chunk, done) {
            var objAst;

            if (!chunk.arguments[1])return done();

            if (chunk.arguments[1].type !== 'ObjectExpression') {
                if (!typeof chunk.arguments[1])done(new Error('Syntax error in' + filepath));

                var funcAst;

                if (chunk.arguments[1].type === 'FunctionExpression') {
                    funcAst = chunk.arguments[1];
                } else if (chunk.arguments[1].type === 'ArrayExpression') {
                    funcAst = helpers.last(chunk.arguments[1].elements)
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
            var i = objAst.properties.length;
            while (i--) {
                var property = objAst.properties[i];
                if (~['templateUrl', 'styles'].indexOf(property.key.name)) {
                    var _filepath = helpers.formatPath(property.value.value, filepath);
                    if (helpers.fileExists(_filepath)) {
                        if (property.key.name === 'templateUrl') {
                            template = _filepath;
                        } else {
                            styles = _filepath;
                        }
                        objAst.properties.splice(i, 1);
                    }
                }
            }

            helpers.parallel([
                function (done) {
                    if (template === null)return done(null, '');
                    helpers.readTemplate(template, done);
                },
                function (done) {
                    if (styles === null)return done(null, '');
                    helpers.readFile(styles, done);
                }
            ], function (err, results) {
                if (err) return done(err);
                var template = results[0];
                var styles = results[1] === '' ? '' : helpers.createStyleTag(results[1]);

                if (template !== '' || styles !== '') {
                    astTemplate = helpers.createTemplateAst(styles + template);
                    objAst.properties.push(astTemplate);
                }

                done();
            });

        })
        .when(patterns.module, function (chunk, done) {

            names.push(chunk.arguments[0].value);
            var elements = [];
            var _parents = parents.slice(0);
            _parents.push(filepath);

            if (chunk.arguments[1].elements.length === 0) {
                return done();
            }

            helpers.map(chunk.arguments[1].elements, function (element, done) {
                var _modulename = element.value;
                var _filepath = helpers.formatPath(_modulename, filepath);

                if (helpers.fileExists(_filepath)) {
                    if (helpers.isLibraryPath(_modulename)) {
                        if (files.hasOwnProperty('!/' + _filepath))return done();
                        helpers.readFile(_filepath, function (err, content) {
                            if (err)return done(err);
                            emitter.emit('data', new Buffer(content + '\n', 'utf-8'));
                            files['!/' + _filepath] = {};
                            done();
                        });
                    } else {
                        if (~_parents.indexOf('/' + _filepath))done(new Error('circular dependecies from ' + _filepath));

                        if (files.hasOwnProperty('/' + _filepath)) {
                            files['/' + _filepath].forEach(function (name) {
                                elements.push(helpers.createDependecyAst(name));
                            });
                            done();
                        } else {
                            var getNext = function (filepath, done) {
                                return function (err, content) {
                                    if (err)return done(err);
                                    scan({
                                        content: content,
                                        filepath: '/' + filepath,
                                        parents: _parents,
                                        files: files,
                                        module: module,
                                        _emitter: emitter
                                    }, function (err, result) {
                                        if (err)return done(err);
                                        result.names.forEach(function (name) {
                                            elements.push(helpers.createDependecyAst(name));
                                        });
                                        done();
                                    });
                                }
                            }
                            if (helpers.isSubdir(_filepath)) {
                                var __filepath = helpers.formatSubdirPath(_filepath);
                                helpers.readDirectory(_filepath, module, getNext(_filepath, function (err) {
                                    if (err)return done(err);
                                    var subdirectories = helpers.getDirectories(__filepath);
                                    helpers.map(subdirectories,
                                        function (subdirectory, done) {
                                            var subdirectorypath = path.join(__filepath, subdirectory);
                                            helpers.readDirectory(subdirectorypath, module, getNext(subdirectorypath, done));
                                        }, done);
                                }));
                            } else if (helpers.isDirectory(_filepath)) {
                                helpers.readDirectory(_filepath, module, getNext(_filepath, done));
                            } else {
                                helpers.readFile(_filepath, getNext(_filepath, done));
                            }
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

            if (!files.hasOwnProperty('/' + filepath)) {
                files['/' + filepath] = names;
                emitter.emit('data', new Buffer(helpers.generate(newAst) + '\n', 'utf-8'));

            }

            if ('function' === typeof done)
                done(null, {
                    names: names
                });
        });

    return emitter;
}

function scanSync(params) {
    var content = params.content;
    var filepath = params.filepath;
    var parents = params._parents;
    var files = params.files;
    var module = params.module

    if (!content) {
        throw new Error('Content requires');
    }

    if (!filepath) {
        throw new Error('Filepath requires');
    }

    parents = !parents ? [] : parents;

    files = !files ? {} : files;

    var names = [];
    var contents = [];

    var ast = helpers.parse(content);

    var newAst = astra(ast)
        .when([
            patterns.directive,
            patterns.route
        ], function (chunk) {
            var objAst;

            if (!chunk.arguments[1])return;

            if (chunk.arguments[1].type !== 'ObjectExpression') {
                if (!typeof chunk.arguments[1])throw new Error('Syntax error in' + filepath);

                var funcAst;

                if (chunk.arguments[1].type === 'FunctionExpression') {
                    funcAst = chunk.arguments[1];
                } else if (chunk.arguments[1].type === 'ArrayExpression') {
                    funcAst = helpers.last(chunk.arguments[1].elements)
                } else {
                    return;
                }

                if (funcAst.body.body[0].argument.type !== 'ObjectExpression')return;

                objAst = funcAst.body.body[0].argument;
            } else {
                objAst = chunk.arguments[1];
            }

            var astTemplate = null,
                template = null,
                styles = null;
            var i = objAst.properties.length;
            while (i--) {
                var property = objAst.properties[i];
                if (~['templateUrl', 'styles'].indexOf(property.key.name)) {
                    var _filepath = helpers.formatPath(property.value.value, filepath);
                    if (helpers.fileExists(_filepath)) {
                        if (property.key.name === 'templateUrl') {
                            template = _filepath;
                        } else {
                            styles = _filepath;
                        }
                        objAst.properties.splice(i, 1);
                    }
                }
            }

            if (template === null) {
                template = '';
            } else {
                template = helpers.readTemplateSync(template);
            }

            if (styles === null) {
                styles = '';
            } else {
                styles = helpers.readFileSync(styles);
                styles = helpers.createStyleTag(styles);
            }

            if (template !== '' || styles !== '') {
                astTemplate = helpers.createTemplateAst(styles + template);
                objAst.properties.push(astTemplate);
            }

        })
        .when(patterns.module, function (chunk) {
            names.push(chunk.arguments[0].value);
            var elements = [];
            var _parents = parents.slice(0);
            _parents.push(filepath);

            if (chunk.arguments[1].elements.length === 0)return;

            var i = chunk.arguments[1].elements.length;
            while (i--) {
                var element = chunk.arguments[1].elements[i];
                var _modulename = element.value;
                var _filepath = helpers.formatPath(_modulename, filepath);

                if (helpers.fileExists(_filepath)) {
                    if (helpers.isLibraryPath(_modulename)) {
                        if (!files.hasOwnProperty('!/' + _filepath)) {
                            contents.push(helpers.readFileSync(_filepath));
                            files['!/' + _filepath] = {};
                        }
                    } else {
                        if (~_parents.indexOf('/' + _filepath))throw new Error('circular dependecies from ' + _filepath);

                        if (files.hasOwnProperty('/' + _filepath)) {
                            files['/' + _filepath].forEach(function (name) {
                                elements.unshift(helpers.createDependecyAst(name));
                            });
                        } else {
                            var _content = helpers.isDirectory(_filepath) ? helpers.readDirectorySync(_filepath, module) : helpers.readFileSync(_filepath);

                            var result = scanSync({
                                content: _content,
                                filepath: '/' + _filepath,
                                parents: _parents,
                                files: files,
                                module: module
                            });

                            result.names.forEach(function (name) {
                                elements.unshift(helpers.createDependecyAst(name));
                            });
                            contents = result.contents.concat(contents);
                            if (helpers.isSubdir(_filepath)) {
                                var __filepath = helpers.formatSubdirPath(_filepath);

                                var subdirectories = helpers.getDirectories(__filepath);
                                subdirectories.forEach(function (subdirectory) {
                                    var subdirectorypath = path.join(__filepath, subdirectory);
                                    var _content = helpers.readDirectorySync(subdirectorypath, module);
                                    var result = scanSync({
                                        content: _content,
                                        filepath: '/' + subdirectorypath,
                                        parents: _parents,
                                        files: files,
                                        module: module
                                    });
                                    result.names.forEach(function (name) {
                                        elements.unshift(helpers.createDependecyAst(name));
                                    });
                                    contents = contents.concat(result.contents);
                                });

                            }
                        }
                    }
                }
                else {
                    elements.unshift(element);
                }
            }
            chunk.arguments[1].elements = elements;
        }).run();

    if (!files.hasOwnProperty('/' + filepath)) {
        contents.push(helpers.generate(newAst));
        files['/' + filepath] = names;
    }

    return {
        names: names,
        contents: contents
    };

}