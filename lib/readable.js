module.exports = Readable;

var stream = require('stream');

var Emitter = require('events').EventEmitter;

var scan = require('./scan').scan;

var helpers = require('./helpers');

require('util').inherits(Readable, stream.Readable);

function Readable(params, opt) {
    stream.Readable.call(this, opt);
    this.inited = false;
    this.params = params;
}

Readable.prototype.init = function () {
    var self = this;
    var next = function (err, content) {
        if (err)throw err;
        self.params.content = content;
        self.params._emitter = new Emitter();

        self.params._emitter.on('data', function (data) {
            self.push(data);
        });

        scan(self.params, function (err) {
            if (err)throw err;
            self.push(null);
        });
    }

    if (helpers.isDirectory(self.params.src)) {
        helpers.readDirectory(self.params.src, self.params.module, next)
    } else {
        helpers.readFile(self.params.src, next);
    }
}

Readable.prototype._read = function () {
    if (this.inited)return;
    this.inited = true;
    this.init();
}
