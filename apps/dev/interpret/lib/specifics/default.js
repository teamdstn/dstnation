var $g      = require('edge');
var fs      = require('fs');
var mkdirp  = require('mkdirp');
var matches = [".html",".jsp",".js",".css",".do",".aspx",".xml",".txt",".php",".json",".gif",".gif"];

(function() {

  var statices = "D:/Cabinet/Sites/"
  module.exports = function(app) {
    function buildFl (fl) {
      return fl;
    }

    return function(req, res, next) {
      /* request
      req.headers['user-agent'] = "---"; */

      /* headers
      res.on('headers', function(headers) { }); */
      var _uri = $g.uparse(req.url);
      var _dir = $g.disjoin(statices + req.headers["host"] +_uri.pathname);
      console.log("%j \n %j".yellow.bold, _uri, _dir)
      var _pth;
      if(!_dir.ext || _dir.ext === ""){
        _dir.ext = ".html";
        _dir.dir += "index";
      }
      console.log(res.headers)
      res.on('body', function() {
        //TODO TypeCheck
        _pth = _dir.device + _dir.dir;
        console.log("%s".red.bold, _pth)

        console.log("%s   $s".green.bold, matches.indexOf(_dir.ext)>-1, _dir.ext)




          mkdirp(_pth, function(err, d){
            try {
              _pth = $g.pjoin(_pth, _dir.name +_dir.ext)
              console.log("%s".green.bold, _pth)
              return fs.writeFile(_pth, res.body, function(err) {
                if(err) return console.log(err);
                console.log("Saved " + res.body.length + " bytes to " + _pth);
              });
            } catch (err) {
              return console.log(err);
            }
          })


      });
      return next();
    };
  };

}).call(this);






