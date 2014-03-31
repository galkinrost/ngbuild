var fs = require('fs-extra');
var path = require('path');

var _ = require('underscore');

var esprima = require('esprima');
var escodegen = require('escodegen');

var astral = require('astral');
var astralPath = require('astral-pass');


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

    var depPath = astralPath();
    var depAstral = astral();

    depPath.name = 'dependencies';

    depPath
        .when(moduleDesc)
        .do(function (chunk) {
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

                    buildResult.names.forEach(function (name) {
                        elements.push(createDepDesc(name));
                    });
                } else {
                    elements.push(chunk.arguments[1].elements[i]);
                }
            }

            chunk.arguments[1].elements = elements;

        });


    depAstral.register(depPath);

    var ast = esprima.parse(text);

    var newAst = depAstral.run(ast);

    asts.push(newAst);
    return {
        names: names,
        dependencies: dependencies,
        asts: asts
    };
}

var concatAsts = function (asts) {

    var contents = [];

    asts.forEach(function (ast) {
        contents.push(escodegen.generate(ast));
    });
    return _.uniq(contents).join('\n');
}

var buildAll = function (filepath, moduleFilename) {
    var buildResult = build(filepath, moduleFilename);
    return  concatAsts(buildResult.asts);

}



module.exports = function (setting) {
    if ('undefined' === typeof setting)throw Error('Missing settings argument');
    if ('undefined' === typeof setting.src)throw Error('Missing src parameter');
    if ('undefined' === typeof setting.dest)throw Error('Missing dest parameter');

    setting.moduleFilename = ('undefined' === typeof setting.moduleFilename ? 'module.js' : settingmoduleFilename);


    var build = buildAll(setting.src, setting.moduleFilename);

    fs.outputFileSync(setting.dest, build);

};

