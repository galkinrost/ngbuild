exports.isScript = isScript;

exports.isLibraryPath = isLibraryPath;

exports.isModulePath = isModulePath;

exports.formatPath = formatPath;

exports.formatSubdirPath = formatSubdirPath;

exports.getDirectories = getDirectories;

exports.createStyleTag = createStyleTag;

exports.createTemplateAst = createTemplateAst;

exports.createDependecyAst = createDependecyAst;

exports.fileExists = fileExist;

exports.isDirectory = isDirectory;

exports.isSubdir = isSubdir;

exports.readDirectory = readDirectory;

exports.readDirectorySync = readDirectorySync;

exports.readFile = readFile;

exports.readFileSync = readFileSync;

exports.readTemplate = readTemplate;

exports.readTemplateSync = readTemplateSync;

var async = require('async'),
    fs = require('fs'),
    _ = require('underscore'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    path = require('path'),
    jade = require('jade');

exports.last = _.last;

exports.parse = esprima.parse;

exports.parallel = async.parallel;

exports.waterfall = async.waterfall;

exports.map = async.map;

exports.generate = escodegen.generate;

function isScript(_path) {
    return path.extname(_path) === '.js';
}

function isJade(path) {
    return /\.jade$/.test(path);
}

function isLibraryPath(path) {
    return /^!\//.test(path) && !isSubdir(path);
}

function isModulePath(path) {
    return /^\//.test(path);
}

function isAbsPath(str) {
    return isLibraryPath(str) || isModulePath(str);
}

function formatPath(dep, currentFile) {
    if (isModulePath(dep)) {
        return dep.slice(1);
    } else if (isLibraryPath(dep)) {
        return dep.slice(2);
    } else {
        if (path.extname(currentFile) !== '') {
            currentFile = path.dirname(currentFile)
        }

        if (isModulePath(currentFile)) {
            currentFile = currentFile.slice(1);
        }

        return path.join(currentFile, dep);
    }
}

function formatSubdirPath(path) {
    return path.replace(/\/+\*+$/, '');
}

function createStyleTag(styles) {
    return '<style>' + styles + '</style>'
}

function createTemplateAst(content) {
    content = !content ? '' : content;
    return { type: 'Property',
        key: { type: 'Identifier', name: 'template' },
        value: { type: 'Literal',
            value: content,
            kind: 'init' }
    }
}

function createDependecyAst(name) {
    return {
        type: 'Literal',
        value: name
    }
}

function fileExist(path) {
    if (isSubdir(path)) {
        path = formatSubdirPath(path);
    }

    return fs.existsSync(path);
}

function isSubdir(path) {
    return /\*$/.test(path);
}

function isDirectory(path) {
    if (isModulePath(path)) {
        path = path.slice(1);
    }

    if (isSubdir(path)) {
        path = formatSubdirPath(path);
    }

    return fs.lstatSync(path).isDirectory()
}

function getDirectories(filepath) {
    var filenames = fs.readdirSync(filepath);

    return _.filter(filenames, function (filename) {
        return isDirectory(path.join(filepath, filename));
    });
}

function readDirectorySync(modulepath, moduleFilename) {
    var self = this;

    if (isModulePath(modulepath)) {
        modulepath = modulepath.slice(1);
    }

    if (isSubdir(modulepath)) {
        modulepath = formatSubdirPath(modulepath);
    }

    var files = fs.readdirSync(modulepath);

    var contents = [];
    files.forEach(function (filename) {
        var filepath = path.join(modulepath, filename);
        if (isScript(filename)) {
            var content = self.readFileSync(filepath);

            if (filename === moduleFilename) {
                contents.unshift(content);
            } else {
                contents.push(content);
            }
        }
    });

    return contents.join('\n');
}

function readDirectory(modulepath, moduleFilename, done) {
    var self = this;

    if (isModulePath(modulepath)) {
        modulepath = modulepath.slice(1);
    }

    if (isSubdir(modulepath)) {
        modulepath = formatSubdirPath(modulepath);
    }

    async.waterfall([
        function (next) {
            fs.readdir(modulepath, next);
        },
        function (files) {
            async.map(files, function (filename, done) {
                var filepath = path.join(modulepath, filename);
                if (isScript(filename)) {
                    self.readFile(filepath, done);
                } else {
                    done();
                }
            }, function (err, results) {
                if (err)return done(err);
                var contents = [];
                for (var i in results) {
                    if (!results[i])continue;
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

function readFile(src, done) {
    if (isModulePath(src)) {
        src = src.slice(1);
    }
    return fs.readFile(src, 'utf8', done);
}

function readFileSync(src) {
    if (isModulePath(src)) {
        src = src.slice(1);
    }
    return fs.readFileSync(src, 'utf8');
}

function readTemplate(src, done) {
    readFile(src, function (err, content) {
        if (err)return done(err);
        if (!isJade(src))return done(null, content);
        done(null, jade.render(content));
    });
}

function readTemplateSync(src) {
    var content = readFileSync(src);
    if (!isJade(src))return content;
    return jade.render(content);
}