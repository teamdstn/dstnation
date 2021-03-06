// Generated by CoffeeScript 1.3.3
(function() {
  var fs;

  fs = require('fs');

  module.exports = function(Mf) {
    return function(req, res, next) {
      res.on('body', function() {
        var fileName, path;
        if (res.headers["content-type"] === 'audio/mpeg') {
          fileName = req.path.replace(/^[a-zA-Z]/, '').split('.')[0];
          path = "" + process.env["HOME"] + "/Downloads/soundcloud" + fileName + ".mp3";
          return fs.writeFile(path, res.body, function() {
            return console.log("Saved " + res.body.length + " bytes to " + path);
          });
        }
      });
      return next();
    };
  };

}).call(this);
