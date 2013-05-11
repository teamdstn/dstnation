var stopwords = require("./stopwords");

var Tokenizer = require("./aggressive_tokenizer");

module.exports = function () {
  var stemmer = this;
  stemmer.stem = function (token) {
    return token;
  };
  stemmer.tokenizeAndStem = function (text, keepStops) {
    var stemmedTokens = [];
    new Tokenizer().tokenize(text).forEach(function (token) {
      if (keepStops || stopwords.words.indexOf(token) == -1) stemmedTokens.push(stemmer.stem(token));
    });
    return stemmedTokens;
  };
  stemmer.attach = function () {
    String.prototype.stem = function () {
      return stemmer.stem(this);
    };
    String.prototype.tokenizeAndStem = function (keepStops) {
      return stemmer.tokenizeAndStem(this, keepStops);
    };
  };
};
