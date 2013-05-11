var lingo = require('lingo');
var ko = new lingo.Language('ko'), en = lingo.en;

ko.name = "Korean";
ko.translations = {
    "Username": '아이디',
    "Password": "비밀번호",
    "This field is required." : "입력해주셔야합니다.",
    "Contact Us" : "고객센터",
    "Live Chat" : "실시간상담",
    "Sign Out" : "로그아웃"
};

var langs = {ko:ko, en:en}
module.exports = langs;