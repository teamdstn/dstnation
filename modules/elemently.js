var dmn = require("./domino");

exports = module.exports = elemently;
function elemently(data, parts, fnds){
  var $ = dmn.load(data), rst={}, _arg;
  for (var i=0, len = parts.length, _arg; i < len; ++i) {
    _arg = [$, rst[parts[i]] = {}];
    fnds && _arg.push(fnds[i]);
    elemently[parts[i]].apply(elemently, _arg)
  }
  return rst;
}

elemently.nameRange = ["name", "account", "id", "username"];
elemently.passRange = ["pass", "password", "pwd", "pw"];

elemently.form = function($, rst, fnd){
  $o = $("body form");
  if(!$o || !$o.length) return;
  for (var i=0, _id, _att, _o, len = $o.length; i < len; ++i) {
    _att = $o[i].attribs;
    _id = _att.name || _att.id;
    if (_id !== void 0) {
      _o = $($o[i]);
      fnd && fnd.test(_o.html()) && (_id="login");
      rst[_id] = {};
      rst[_id].attr = _att;
      rst[_id].input = {};
      _o.children("input").each(function(n) {
        var dis = $(this);
        rst[_id].input[dis.attr("name")] = this.attribs.value || "";
      });
    }
  }
  return rst;
}
