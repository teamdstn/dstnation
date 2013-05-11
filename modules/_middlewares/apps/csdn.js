var pt    = require("path")
  , fs    = require("fs")
;//_________________________________
!fs.graceful && (require("../../_graceful/fs"));

/* "cdn store" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
module.exports = function csdn(options) {
  var _cdn = options.cdn;
  var _ext = options.ext || /\.(js|css|swf|gif|png|jpg|jpeg)/;
  var _dir = options.dir;
  var _frc = options.frc;
  var _req = options.req;
  Array.isArray(_dir) && (_dir = pt.join.apply(pt.join, _dir));

  return function csdn(req, res, next) {
    var ext = pt.extname(req.pathname || req.path.split("?")[0]);

    if(ext && /\.(js|css|swf|gif|png|jpg|jpeg)/.test(ext)){
      fs.mkdirp.ws([_dir, req.path], _frc, function(err, ws){
        if(ws.readable){
          ws.pipe(res);
        }else{
          var _abort, _reqp = _req.get(_cdn + req.path, {proxy:_req.proxy})
          .on("fail", function(statusCode, o){ _abort = o._aborted = true; ws.del( function(){ res.send(statusCode); }); });
          _reqp.pipe(ws);
          _reqp.pipe(res);
        }
      });
    }else{
      next();
    }
  }
}
