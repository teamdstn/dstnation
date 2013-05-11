var proto = require('../proto')
  , $u = require('../util')
  , pt = require('path')
  , static = require('connect/lib/middleware/static');



var StaticPlugin = function () {
  proto.apply(this, arguments);
}




$u.inherits(StaticPlugin, proto);

StaticPlugin.prototype.editors = function () {
  return ['Text', 'Checkbox', 'Checkboxes', 'Date', 'DateTime', 'Hidden', 'List', 'NestedModel', 'Number', 'Object', 'Password', 'Radio', 'Select', 'TextArea', 'MultiEditor'];
}

StaticPlugin.prototype.filters = function () {
  var prefix      = this.baseUrl
    , sdir        = pt.join(this.path, 'public')
    , psdir       = pt.join(process.cwd(), 'public')
    , public      = static(sdir)
    , publicUser  = static(psdir)
  ;//=============================
  this.app.get(prefix + '*',
    [
        function(req, res, next) {req._url = req.url; req.url = req.url.substring(prefix.length - 1); next(); }
      , publicUser
      , public
      , function (req, res, next) {req.url = req._url; next();}
    ]
  );
}
StaticPlugin.prototype.routes = function () {}
module.exports = StaticPlugin;
