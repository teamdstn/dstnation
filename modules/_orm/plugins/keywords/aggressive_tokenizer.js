var Tokenizer = require("./tokenizer")
  , inherits = require("util").inherits
;//====================================
AggressiveTokenizer = function () { Tokenizer.call(this); };
inherits(AggressiveTokenizer, Tokenizer);
module.exports = AggressiveTokenizer;
AggressiveTokenizer.prototype.tokenize = function (text) { return this.trim(text.split(/\W+/)); };
