var mongoose    = require("mongoose")
  , $u          = require("./util")
  , regex       = require("./regex")
;//=============================================
var Schema      = exports.Schema = mongoose.Schema
  , ObjectId    = mongoose.Schema.ObjectId
  , Mixed       = mongoose.Types.Mixed
;//=============================================
function err(e, req, res, next) { console.error("[31m%s [0m: [31m[1m%s [0m", "E", e); };
var __gen = {
  hash: {
    validator: regex.validator,
    setter: {},
    getter: {},
    "default": {}
  },
  set: function (p, k, v) {
    var _hash = {
      v: __gen.hash.validator,
      d: __gen.hash["default"],
      s: __gen.hash.setter,
      g: __gen.hash.getter
    }[p[0]][k];
    return v ? _hash = v : _hash;
  },
  get: function (p, k) {
    return __gen.set(p, k);
  },
  type: function (v) {
    return {
      a: Array,
      s: String,
      n: Number,
      b: Boolean,
      f: Buffer,
      d: Date,
      o: ObjectId,
      m: Mixed,
    }[/buffer/i.test(v) ? "f" : v[0]];
  },
  tags: function (v) {
  }
};
var db = mongoose.createConnection();

exports.connection = function (_db, models, cb) {
  if (!_db instanceof mongoose.Connection) err("mongoose.Connection expected but got " + _db);
  db = _db;
  if(models){
    var _models = {};
    $u.each(models, function(v,k){
      var _mod  = exports.schema(k, v)
        , _mnm  = _mod.modelName
      ;//=======================================
      _models[k] = db.model(_mnm)
    });
    return cb ? cb(null, _models) : _models;
  }
};
exports._convert = function convert(desc) {
  var l = desc;
  return JSON.parse(JSON.stringify(desc), function (k, v) {
    if("type"===k) {
      v === "e" && (v="s",this.validate = __gen.get("v","email")());
      v === "u" && (v="s",this.validate = __gen.get("v","url")());
      return __gen.type(v);
    }else if(/^(view)/.test(k)) { console.log(k,v); v = null;
    }else if(/^(validate|get|set|default|match)/.test(k)) { v = v.split(":"); return k === "" ? v : __gen.get(k,v[0])(v[1]);
    }else if(/^(lowercase|uppercase|trim|mat|enum|min|max|ref|type|default|required|select|get|set|index|unique|sparse|validate)/.test(k)){ return v;
    }else{
      console.log("[32m%s [0m: [32m[1m%s [0m", "x:", k);
    }
    if(k==="options" || !v){
      delete l;
    }else{
      return v;
    }
  });
};
exports._field = function field(schm, options) {
  var _fld = forms.fields.types()
};

exports.schema = function (k, v, report, pi, vi) {
  v.options && v.options.p && (pi=v.options.p);
  v.options && v.options.v && (vi=v.options.v);
  !$u.is.str(k) && (err("expected string for param name"));
  !$u.is.obj(v) && (err("expected object for param desc"));
  if (!db) err("expected a mongoose.Connection params. Call setConnection() before schema()");
  var o = exports._convert(v.schm||v.schema);

  var schema = new Schema(o);
  if(pi !== void 0 && pi.length){
    for (var i=0, len = pi.length; i < len; ++i) {
      schema.plugin(Object(pi[i])!==pi[i]? require("./plugins/"+pi[i]) : pi[i]);
    }
  }
  if(vi !== void 0){
    schema.static('_', seletor(vi))
  }
  report && (report.set("report:"+k, schema),report.save());
  return mongoose.model(k, schema);
};

function seletor(roles) {
  var _roles = roles;
  return function seletor(options, next) {
    options = options   || options;
    var _cb= options.cb || next
      , _qry = options.qry || this.find({})
      , _sel
    ;//==================================
    options.roles && (_sel=roles.role, _roles[roles.name] = _sel);
    return _qry.select(_sel || _roles[options.role || "def"]).exec(_cb);
  }
};


exports._hash = __gen.hash;
exports.type  = __gen.type;
exports.get   = __gen.get;
exports.set   = __gen.set;
/*
//Form==================================
var forms = require("./../forms")
  , nspt  = forms.validators
  , wdgs  = forms.widgets
  , flds  = forms.fields
;//======================================
function form(params, extra_params) {
  params    = $u.extend({}, params, extra_params);
  var frm   = frm.create(params);
  return form;
};
function convertField(f) {
  //console.log(f, forms.fields.types(f))
  //return fields[fields.string];
}
*/
