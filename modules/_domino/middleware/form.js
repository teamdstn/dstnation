module.exports = function img(options) {
  options = options || {};
  var self = this;
  var parser = options.parser || "form";
  var forms = {};
  var acc =undefined;

  return function middleware(req, res, $, next) {
    //[] :____________________
    var o = $(parser)
      , _txt, _data = {}, _src, _ref, _nm, _len;
    ;//_______________________
    for (var i = 0, len = o.length; i < len; i++) {
      _txt = o[i].attribs.name || o[i].attribs.id;
      if (_txt !== void 0 && !forms.hasOwnProperty(_txt)) {
        forms[_txt] = {};
        forms[_txt].attr = o[i].attribs;
        //forms[_txt].url = uri.hostname;
        forms[_txt].input = {};

        console.log(forms[_txt]);

        $(o[i]).children("input").each(function(ii) {
          var dis = $(this);
          forms[_txt].input[dis.attr("name")] = this.attribs;
        });
        if (_txt.indexOf("login") > -1 && acc) {
          //plog(forms[_txt], uri);
        }
      }
    }
    next();
  };
};