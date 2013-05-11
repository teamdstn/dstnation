var langs = require('../i18n/langs');
var func = {
  lang:function(str){
    this._lang = langs[str];
  },
  __ : function(str){
    //return this._lang.translate(str)
    return str
  }
}

module.exports = func;