exports.build = build;

exports.getReadable = getReadable;

exports.buildSync = buildSync;

var fs = require('fs');

var Readable = require('./lib/readable');

var scanSync = require('./lib/scan').scanSync;

function build(params) {
    if (!params.dest)throw new Error('Missing dest parameter');

    params.module = !params.module ? 'module.js' : params.module;
    params.filepath = params.src;

    var writeStream = fs.createWriteStream(params.dest, {encoding: 'utf-8'});
    var readable = new Readable(params);

    readable.pipe(writeStream);

    return readable;
}

function getReadable(params) {
    params.module = !params.module ? 'module.js' : params.module;
    params.filepath = params.src;
    return new Readable(params);
}

function buildSync(params) {
    params.module = !params.module ? 'module.js' : params.module;
    params.filepath = params.src;
    params.content = fs.readFileSync(params.filepath);

    return scanSync(params).contents.join('\n');
}