module.exports = function (def, o) {
  if(def && !o && def.indexOf(":") > 0 ){
    for (var j=0, o={}, opt, _opt= def.split("::"), _len = _opt.length; j < _len; ++j) {
      opt = _opt[j].split(":");
      o[opt[0]] = opt[1];
    }
  }else{
    var keys = Object.keys(def)
      , i = keys.length
      , k ;
    o = o || {};
    while (i--) {
      k = keys[i];
      if (!(k in o)) {
        o[k] = def[k];
      }
    }
  }
  return o;
};
