//[DEPENDENCE] :_________________________________
var fs            = require('fs')
  , extname       = require('path').extname
  , EventEmitter  = require('events').EventEmitter
;//_______________________________________________

module.exports = function (files, options) {
  //[] :------------------------
  options = options || {};
  files   = files   || {};
  !Array.isArray(files) && (files = [ files ]);
  options.ext && !/^\./.test(options.ext) && (options.ext = '.' + options.ext);
  ;//---------------------------
  //[] :-------------------------
  var emitter = new EventEmitter
    , pending = files.length
  ;//----------------------------
  files.forEach(function (file) {
    //[] :-----------------------
    var ext = extname(file)
      , rs_, ws_
    ;//--------------------------

    if (options.ext && ext !== ext) return;
    if (ext === '.js') return;

    rs_ = fs.createReadStream(f);
    rs_.on('error', emitter.emit.bind(emitter, 'error'));
    ws_ = fs.createWriteStream(f + '.js');
    ws_.on('error', emitter.emit.bind(emitter, 'error'));

    ws_.write('module.exports="');
    rs_.on('data', function (buf) {
      var s = JSON.stringify(String(buf)).slice(1,-1);
      ws_.write(s);
    });
    rs_.on('end', function () {
      ws_.end('"\n');
      emitter.emit('export', f);
      if (--pending === 0) emitter.emit('end');
    });
  });
  return emitter;
};
