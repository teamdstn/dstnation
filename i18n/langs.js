var lingo = require('lingo');
var en = lingo.en
  , ko = new lingo.Language('ko')
  , jp = new lingo.Language('jp') 
;//----

ko.name = "Korean";
ko.translations = {
    "Username": '아이디',
    "Password": "비밀번호"
};

ko.name = "Japaness";
ko.translations = {
    "Username": 'ID',
    "Password": "パスワード"
};

var langs = {en:en, ko:ko, jp:jp}

module.exports = langs;