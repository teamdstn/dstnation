var fs      = require("fs")
  , pt      = require("path")
  , crypto  = require("crypto")
;//=====================================

function __o(o, k) { return o[k] || (o[k] = {}); }
function create(fi, type, obj) {
  //ctor ---
  function instance(fi){
    fi = fi || _instance.filename;
    instance.siblings = instance.list();
    instance.doc = fs.readFileSync(_instance.filename+"","utf-8");
    try {
      instance.doc = JSON.parse(_instance.doc);
      instance.type = "json";
    } catch (e) {
    }
    return _instance;
  };

  for (var k in proto) instance[k] = proto[k];
  fi !== void 0 && (instance.filename = Array.isArray(fi) ? pt.join.apply(pt.join, fi) : fi);
  return instance;
  //Object ---
  //obj = Object.create(proto, {});
  //obj.filename = Array.isArray(fi) ? pt.join.apply(pt.join, fi) : fi;
  //return obj;
}
//Circular
create.create = create
;//=====================================
var proto = {};
proto.save = function (key, data, cb) {
  var conf = this.read(this.filename);
  var now = Date.now();
  var self = this;
  if (conf) {
    fs.renameSync(this.filename, this.filename + "." + now);
  } else {
    conf = {};
    var dir = pt.dirname(this.filename);
    !fs.existsSync(dir) && fs.mkdirSync(dir);
  }
  (conf.plugins || (conf.plugins = {}))[key] = data;
  var str = JSON.stringify(conf);
  var sha = crypto.createHash("sha1").update(str).digest("base64");
  fs.writeFile(this.filename, str, "utf-8", function (err, stuff) {
    err && fs.renameSync(self.filename + "." + now, self.filename);
    cb(err, {
      _id: sha,
      timestamp: now
    });
  }.bind(this));
};

proto.list = function (fi, cb) {
  fi = fi ||  this.filename;
  if(typeof fi === "function") {cb = fi, fi = this.filename;}
  return cb ? fs.readdir(pt.dirname(fi), cb) : fs.readdirSync(pt.dirname(fi));
};

proto.read = function (fi) {
  fi === void 0 && (fi = this.filename);
  if (fs.existsSync(fi)) return this.filetype === "json" ? JSON.parse(fs.readFileSync(fi + "")) : fs.readFileSync(fi + "");
};

