exports = module.exports = function expose(options) {
  options     = options || {};
  var gc      = require("../../_natives/gc");
  var format  = require("util").format;
  var _safe   = options.safe || true;

  return function expose(req, res, next) {
    var _err = req.session.error
      , _msg = req.session.success
      , _uid = req.session.uid
    ;//==========================
    delete req.session.error;
    delete req.session.success;

    res.locals.uid      = _uid;
    res.locals.message  = "";
    if (_err) res.locals.message = '<p class="msg error">'   + _err +'</p>';
    if (_msg) res.locals.message = '<p class="msg success">' + _msg +'</p>';

    if (req.flash && _safe) {
      return next();
    }
    req.flash = _flash;
    next();

  }
}
function _flash(type, msg) {
    if (this.session === undefined) throw Error("req.flash() requires sessions");
    var msgs = this.session.flash = this.session.flash || {};
    if (type && msg) {
        if (arguments.length > 2 && format) {
            var args = Array.prototype.slice.call(arguments, 1);
            msg = format.apply(undefined, args);
        }
        return (msgs[type] = msgs[type] || []).push(msg);
    } else if (type) {
        var arr = msgs[type];
        delete msgs[type];
        return arr || [];
    } else {
        this.session.flash = {};
        return msgs;
    }
}
function exposeSet(s, p, v) {"string" === typeof s  && (v = p , p = s, s = this), p = p.split(":");
  var k, i; for (i in p) { k = p[i]; if (!s[k]){ s[k] = ((+i + 1 === p.length) ? v : {}); }; s = s[k]; }
}
