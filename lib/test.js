exports.expect = expect;

var should = require('should'),
    fs = require('fs');

function removeSpaces(string) {
    return string.replace(/(\r\n|\n|\r|\s|\\n)/gm, "");
}

function expect(content, targetFilepath) {
    removeSpaces(content).should.be.equal(removeSpaces(fs.readFileSync(targetFilepath, 'utf-8')));
}