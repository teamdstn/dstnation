var Parser = require("./Parser.js");

var WritableStream = function(cbs, options) {
    Parser.call(this, cbs, options);
};

require("util").inherits(WritableStream, require("stream").Stream);

Object.getOwnPropertyNames(Parser.prototype).forEach(function(name) {
    WritableStream.prototype[name] = Parser.prototype[name];
});

WritableStream.prototype.writable = true;

module.exports = WritableStream;