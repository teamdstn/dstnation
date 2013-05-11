module.exports = function script(options) {
  options = options || {};
  var self = this;
  // var _app = self();
  //_app.suit("http://www.naver.com/");
  var parser = options.parser || "script";
  var block  = /gaJsHost|pageTracker/;
  return function img(req, res, $, next) {
    //[] :____________________
    var o = $(parser)
      , _txt, _data, _src;
    ;//_______________________
    for (var i = 0, len = o.length; i < len; i++) {
      if (o[i].attribs.src) {

        //;
        console.log("_src = buildRef(o[i].attribs.src, uri)", o[i].attribs.src)
        console.log("buildStatic(_src, cb9);")
      } else {
        _txt = o[i].children;
        if (_txt.length && _txt[0].data && _txt[0].data.length > 8) {
          if (!block.test(String(_txt[0].data))) {
            _data = String(_txt[0].data);
            //vm.runInNewContext(_fk, {window: window, getParams:getParams, console:console}, "context.memu");
            if (/swfobject|embedSWF|.swf|flashvars/.test(_data)) {
              //jqfy(_data);
              //vmc(_data);
            }
            if (o[i].parent.name === "head") {} else {}
          }
        }
      }
    }
    next();
  };
};