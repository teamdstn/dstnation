var fs      = require('fs');
var path    = require('path');
var mkdirp  = require('mkdirp');
var mimetxts = [".html",".jsp",".js",".css",".do",".aspx",".xml",".txt",".php",".json"];

exports.middleware = function(options) {

  options = options || {};
  options.static = path.normalize(options.static || "D:/Cabinet/Sites/Bodogjob2");
  options.exception = [];

  return function(req, res, next) {
    res.on('body', function() {
        req.pathname = req.pathname.replace(/http:\/\/|https:\/\/|www\./gi,"").replace(RegExp(req.host),"");
      //if(/[A-Za-z0-9-_\.]+(bd-?[A-Za-z0-9]+)|(bodog[A-Za-z0-9]+)|(digikhan[A-Za-z0-9]+)\.com/.test(req.host)){

        var _ext = path.extname(req.url);
        var _ffe = mimetxts.indexOf(_ext===""?".html":_ext)>-1 ? true : false;
        var _pth = path.join(options.static, req.host, req.pathname);
        _ext == "" && (_pth+=path.sep+"index.html");
        var _dir = path.dirname(_pth);


        console.log("%s %s %s".yellow.bold, _pth, _dir, _ext);

        mkdirp(_dir, function(err, d){
          console.log("%s %s %s".red.bold, req.host, req.pathname, err);
          try {
            return fs.writeFile(_pth, res.body, function(err) {
              if(err) return console.log(err);
              console.log("Saved " + res.body.length + " bytes to " + _pth);
            });
          }
          catch (err) {
            return console.log(err);
          }

        });
        //if(!fs.existsSync(_pth) || _ffe){

      //}
    });
    return next();
  };
};