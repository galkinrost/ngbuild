exports.isScript = isScript;

exports.isLibraryPath = isLibraryPath;

exports.isModulePath = isModulePath;

exports.formatPath = formatPath;

exports.createStyleTag = createStyleTag;

exports.createTemplateAst = createTemplateAst;

exports.createDependecyAst = createDependecyAst;

exports.fileExists = fileExist;

exports.isDirectory = isDirectory;

exports.readDirectory = readDirectory;

exports.readDirectorySync = readDirectorySync;

exports.readFile = readFile;

exports.readFileSync = readFileSync;

var async = require('async'),
    fs = require('fs'),
    _ = require('underscore'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    path = require('path');

exports.last = _.last;

exports.parse = esprima.parse;

exports.parallel = async.parallel;

exports.waterfall = async.waterfall;

exports.map = async.map;

exports.generate = escodegen.generate;

function isScript(_path) {
    return path.extname(_path) === '.js';
}

function isLibraryPath(path) {
    return /^!\//.test(path);
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
        return path.join(currentFile, dep).slice(1);
    }
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

function fileExist(filepath) {
    return fs.existsSync(filepath);
}

function isDirectory(filepath) {
    if (isModulePath(filepath)) {
        filepath = filepath.slice(1);
    }

    return fs.lstatSync(filepath).isDirectory()
}

function readDirectorySync(modulepath, moduleFilename) {
    var self = this;

    if (isModulePath(modulepath)) {
        modulepath = modulepath.slice(1);
    }

    var files = fs.readdirSync(modulepath);

    files = _.filter(files, function (path) {
        return isScript(path)
    });

    var contents = [];
    files.forEach(function (filename) {
        var content = self.readFileSync(path.join(modulepath, filename));

        if (filename === moduleFilename) {
            contents.unshift(content);
        } else {
            contents.push(content);
        }
    });

    return contents.join('\n');
}

function readDirectory(modulepath, moduleFilename, done) {
    var self = this;

    if (isModulePath(modulepath)) {
        modulepath = modulepath.slice(1);
    }

    async.waterfall([
        function (next) {
            fs.readdir(modulepath, next);
        },
        function (files) {
            files = _.filter(files, function (path) {
                return isScript(path)
            });
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
