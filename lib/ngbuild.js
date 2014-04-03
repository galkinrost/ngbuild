var fs = require('fs-extra');
var path = require('path');

var _ = require('underscore');

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

    this.src = setting.src;

    this.isInited = false;
    this.count = 0;

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

Builder.prototype.readDirectory = function (modulepath, moduleFilename) {
    if (/^\//.test(modulepath)) {
        modulepath = modulepath.slice(1);
    }

    var contents = [];
    var files = fs.readdirSync(modulepath);

    for (var i in files) {
        var content = this.readFile(path.join(modulepath, files[i]));
        if (files[i] === moduleFilename) {
            contents.unshift(content);
        } else {
            contents.push(content);
        }
    }

    return contents.join('\n');

}

Builder.prototype.readFile = function (src) {
    if (/^\//.test(src)) {
        src = src.slice(1);
    }
    return fs.readFileSync(src, 'utf8');
}

Builder.prototype.build = function (filepath, parents) {
    parents = ('undefined' === typeof parents ? [] : parents);

    this.count++;

    var self = this;

    var text = this.isDirectory(filepath) ? this.readDirectory(filepath, this.moduleFilename) : this.readFile(filepath);
    var names = [];

    var ast = esprima.parse(text);

    var newAst = astra(ast)
        .when(this.directivePattern, function (chunk) {
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
                template = '',
                styles = '';
            for (var i in funcAst.body.body[0].argument.properties) {
                var property = funcAst.body.body[0].argument.properties[i];
                if (property.key.name === 'template' && self.isModulePath(property.value.value)) {
                    astTemplate = property;
                    try {
                        template = self.readFile(property.value.value);
                    } catch (e) {
                        throw Error('Dependency not found in ' + filepath);
                    }
                } else if (property.key.name === 'styles') {
                    styles = self.isModulePath(property.value.value) ? self.readFile(property.value.value) : property.value.value;
                    styles = self.createStyleTag(styles);
                    funcAst.body.body[0].argument.properties.splice(i, 1);
                }
            }

            if (astTemplate === null) {
                astTemplate = self.createTemplateAst(styles + template);
                funcAst.body.body[0].argument.properties.push(astTemplate);
            } else {
                astTemplate.value.value = styles + template;
            }
        })
        .when(this.modulePattern, function (chunk) {
            names.push(chunk.arguments[0].value);
            var elements = [];
            var _parents = parents.slice(0);
            _parents.push(filepath);

            for (var i in chunk.arguments[1].elements) {
                var _filepath = chunk.arguments[1].elements[i].value;

                if (self.isModulePath(_filepath)) {

                    _filepath = _filepath.substring(1);

                    if (~_parents.indexOf(_filepath))throw Error('circular dependecies from ' + _filepath)

                    var buildResult = self.build(_filepath, _parents);

                    buildResult.names.forEach(function (name) {
                        elements.push(self.createDependecyAst(name));
                    });
                } else {
                    elements.push(chunk.arguments[1].elements[i]);
                }
            }

            chunk.arguments[1].elements = elements;
        })
        .run();

    this.count--;

    var buffer = new Buffer(escodegen.generate(newAst) + '\n', 'utf-8');

    this.push(buffer);

    return {
        names: names
    };
}

Builder.prototype._read = function () {

    if (this.isInited && this.count === 0)return this.push(null);
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

