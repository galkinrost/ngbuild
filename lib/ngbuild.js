var fs = require('fs-extra');
var path = require('path');

var _ = require('underscore');

var esprima = require('esprima');
var escodegen = require('escodegen');

var astra = require('astra');


var moduleDesc = {
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

var directiveDesc = {
    type: 'CallExpression',
    callee: { type: 'MemberExpression',
        object: { type: 'CallExpression'},
        property: { type: 'Identifier', name: 'directive' }
    }
};

var createStyles = function (styles) {
    return '<style>' + styles + '</style>'
}

var createTemplateDesc = function (content) {
    content = 'undefined' === typeof content ? '' : content;
    return { type: 'Property',
        key: { type: 'Identifier', name: 'template' },
        value: { type: 'Literal',
            value: content,
            kind: 'init' }
    }
}

var createDepDesc = function (name) {
    return {
        type: 'Literal',
        value: name
    }
}

var isAllowedPass = function (path, moduleFilename) {
    return /^\//.test(path);
}

var isModule = function (filepath) {
    if (/^\//.test(filepath)) {
        filepath = filepath.slice(1);
    }
    return fs.lstatSync(filepath).isDirectory()
}

var readModule = function (modulepath, moduleFilename) {
    if (/^\//.test(modulepath)) {
        modulepath = modulepath.slice(1);
    }

    var contents = [];
    var files = fs.readdirSync(modulepath);

    for (var i in files) {
        var content = read(path.join(modulepath, files[i]));
        if (files[i] === moduleFilename) {
            contents.unshift(content);
        } else {
            contents.push(content);
        }
    }

    return contents.join('\n');

}

var read = function (src) {
    if (/^\//.test(src)) {
        src = src.slice(1);
    }
    return fs.readFileSync(src, 'utf8');
}

var build = function (filepath, moduleFilename, parents) {
    parents = ('undefined' === typeof parents ? [] : parents);

    var text = isModule(filepath) ? readModule(filepath, moduleFilename) : read(filepath);

    var names = [];
    var dependencies = [];
    var asts = [];
    var styles = [];

    var ast = esprima.parse(text);

    var newAst = astra(ast)
        .when(directiveDesc, function (chunk) {
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
                if (property.key.name === 'template' && isAllowedPass(property.value.value)) {
                    astTemplate = property;
                    try {
                        template = read(property.value.value);
                    } catch (e) {
                        throw Error('Dependency not found in ' + filepath);
                    }
                } else if (property.key.name === 'styles') {
                    styles = isAllowedPass(property.value.value) ? read(property.value.value) : property.value.value;
                    styles = createStyles(styles);
                    funcAst.body.body[0].argument.properties.splice(i, 1);
                }
            }

            if (astTemplate === null) {
                astTemplate = createTemplateDesc(styles + template);
                funcAst.body.body[0].argument.properties.push(astTemplate);
            } else {
                astTemplate.value.value = styles + template;
            }
        })
        .when(moduleDesc, function (chunk) {
            names.push(chunk.arguments[0].value);
            var elements = [];
            var _parents = parents.slice(0);
            _parents.push(filepath);

            for (var i in chunk.arguments[1].elements) {
                var _filepath = chunk.arguments[1].elements[i].value;

                if (isAllowedPass(_filepath)) {
                    dependencies.push(_filepath);

                    _filepath = _filepath.substring(1);

                    if (~_parents.indexOf(_filepath))throw Error('circular dependecies from ' + _filepath)

                    var buildResult = build(_filepath, moduleFilename, _parents);

                    asts = asts.concat(buildResult.asts);
                    styles = styles.concat(buildResult.styles);


                    buildResult.names.forEach(function (name) {
                        elements.push(createDepDesc(name));
                    });
                } else {
                    elements.push(chunk.arguments[1].elements[i]);
                }
            }

            chunk.arguments[1].elements = elements;
        })
        .run();

    asts.push(newAst);

    return {
        names: names,
        dependencies: dependencies,
        asts: asts,
        styles: styles
    };
}

var concatAsts = function (asts) {

    var contents = [];

    asts.forEach(function (ast) {
        contents.push(escodegen.generate(ast));
    });
    return _.uniq(contents).join('\n');
}

var buildStyles = function (styles) {
    var result = [];
    styles.forEach(function (filename) {
        result.unshift(read(filename));
    });

    return result.join('\n');
}

var buildAll = function (filepath, moduleFilename) {
    var buildResult = build(filepath, moduleFilename);

    return  {
        script: concatAsts(buildResult.asts),
        styles: buildStyles(buildResult.styles)
    };
}


module.exports = function (setting) {
    if ('undefined' === typeof setting)throw Error('Missing settings argument');
    if ('undefined' === typeof setting.src)throw Error('Missing src parameter');
    if ('undefined' === typeof setting.dest)throw Error('Missing dest parameter');


    setting.moduleFilename = ('undefined' === typeof setting.moduleFilename ? 'module.js' : settingmoduleFilename);

    var build = buildAll(setting.src, setting.moduleFilename);

    fs.outputFileSync(setting.dest, build.script);

};

