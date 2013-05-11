var Tokenizer = function () {};

Tokenizer.prototype.trim = function (array) {
  if (array[array.length - 1] == "") array.pop();
  if (array[0] == "") array.shift();
  return array;
};

Tokenizer.prototype.attach = function () {
  var tokenizer = this;
  String.prototype.tokenize = function () {
    return tokenizer.tokenize(this);
  };
};

Tokenizer.prototype.tokenize = function () {};

module.exports = Tokenizer;
