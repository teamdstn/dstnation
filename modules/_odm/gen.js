var mongoose    = require("mongoose")
  , $u          = require("./util")
  , cycle       = require("edge/modules/cycle")
  , opts        = require("edge/modules/options")
;//=============================================
var Schema      = mongoose.Schema
  , ObjectId    = mongoose.Schema.ObjectId
  , Mixed       = mongoose.Types.Mixed
;//=============================================

var validator = {
  rng : function(val) {
    val = val ?  val.split("-") : [6,10];
    var _range = RegExp("^.{"+parseInt(val[0],10)+","+parseInt(val[1])+"}$");
    return function(value) {
      return _range.test(value);
    };
  },
  e : function() {
    return function(value) {
      return /[_a-zA-Z0-9\-"'\/]+(\.[_a-zA-Z0-9\-"'\/]+)*@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.(([0-9]{1,3})|([a-zA-Z]{2,3})|(aero|coop|info|museum|name))/.test(value);
    };
  },
  u : function() {
    return function(value) {
      return /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:~\+#]*[\w\-\@?\^=%&amp;~\+#])?/.test(value);
    };
  }
};

var statics = {};
var methods = {};
statics.findTitleLike = function findTitleLike(q, term) {
  var search = term || q && q.title;
  if (!search)
      return this.find({_id:null});
  return this.find({title:new RegExp(search, 'i')});
}

methods.findCommentsLike = function (q, term) {
  var search = term || q.title;
  return this.find({comments:new RegExp(search, 'i')});
}

function makeSafe(thisText, allowSpace) {
    thisText = thisText+"";
    var w = "!@#$%^&*()+=[]\\\';,./{}|\":<>?"
      , s = 'abcdefghijklmnopqrstuvwxyz0123456789-_'
      , x = ['àáâãäå', 'ç', 'èéêë', 'ìíîï', 'ñ', 'ðóòôõöø', 'ùúûü', 'ýÿ']
      , r = ['a', 'c', 'e', 'i', 'n', 'o', 'u', 'y']
      , thisChar;
    if(allowSpace) {
      s = s + ' ';
    }
    thisText = thisText.toLowerCase();
    var newText = [];
    for (var i = 0; i < thisText.length; i++){
      thisChar = thisText.charAt(i);
      if(w.indexOf(thisChar) == -1) {
        if(s.match(''+thisChar+'')) {
          newText[i] = thisChar;
        } else {
          for (var j = 0; j < x.length; j++) {
            if(x[j].match(thisChar)){
              newText[i] = r[j];
            }
          }
        }
      }
    }
  var safe_url = newText.join('');
  safe_url = safe_url.replace(/\s/g , "-");
  return safe_url;
}

function __makeSafe(v) {
  return makeSafe(v, true);
}
var setter = {};
setter.makeSafe = __makeSafe;


var requires = {};
var gen = module.exports =  {
  pipath: "./plugins/",
  parse: function(nm, obj){
    var _column = {};
    $u.each(obj, function(v,k,l){
      if ("type" === k) {
        if("e"===v||"u"===v){
          _column.validate= [gen.get("v", v)()];
          v="s";
        }
        return _column.type = gen.type(v);
      } else if (/^(validate|get|set|match)/.test(k)) {
        v = v.split(":");
        return _column[k] = k === "" ? v : v.length>1 ? gen.set(k, v[0])(v[1]) : gen.set(k, v[0]);
      } else if(/^(perm|alias|ref|schema)/.test(k)){
        _column[k] = v;
      } else if (/^(lowercase|uppercase|trim|enum|min|max|ref|type|default|required|select|index|unique|sparse)/.test(k)) {
        return _column[k] = v;
      }
    }, _column);
    _column.type === void 0 && (_column.type = String);
    return _column;
  },
  display: function(o, schema){
  },
  router: function(o, schema){
    schema.router = o;
  },
  plugins: function(pi, schema){
    !Array.isArray(pi) && (pi=pi.split(" "));
    for (var i=0, len = pi.length; i < len; ++i) {
      var _pi = pi[i].split("|");
      var _plugin = requires[_pi[0]] || (requires[_pi[0]] = require(gen.pipath+_pi[0]));
      if(_pi.length>1){
        _plugin(schema, opts(_pi[1]));
      }else{
        schema.plugin(_plugin);
      }
    }
  },
  hash: {
    validator: validator,
    setter: setter,
    getter: {},
    "default": {}
  },
  set: function (p, k, v) {
    var _hash = {
      v: gen.hash.validator,
      d: gen.hash["default"],
      s: gen.hash.setter,
      g: gen.hash.getter
    }[p[0]][k];
    return v ? _hash = v : _hash;
  },
  get: function (p, k) {
    return gen.set(p, k);
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
      m: Mixed
    }[/buffer/i.test(v) ? "f" : v[0]];
  },
  tags      : function (v) {},
  friendly  : friendly,
  abstract  : abstract,
  htmlfy    : htmlfy
};


function abstract(obj) {
  var modelName = obj.modelName;
  var collectionProtoype = obj.prototype.schema.paths;
  var items = new Array();
  for (obj in collectionProtoype) {
    var itemObject = collectionProtoype[obj];
    var key = {};
    key.name = itemObject.path.toString();
    try {
      key.type = itemObject.options.type.name;
    } catch (error) {
      key.type = "Empty";
    }
    items.push(key);
  }
  var _model = {
    ModelName: modelName,
    keys: items
  };
  console.log("--------------------");
  console.log("%j", _model);
  console.log("--------------------");
  return _model;
  //abstracts.push(myModel);
  //var htmlm = HTMLModel(modelName, items);
  //console.log(htmlm);
}

function htmlfy(modelName, keys) {
  if(Object(modelName) === modelName){
    var obj = abstract(modelName);
    modelName = obj.ModelName;
    keys = obj.keys;
  }

  var HTMLString="";
  HTMLString += '<div class="modelTitle"><code>' + modelName + "</code></div>";
  HTMLString += '<div class="models">';
  HTMLString += '<div id="' + modelName + '">';
  for (key in keys) {
    var name = keys[key].name;
    var type = keys[key].type;
    if (type === "Boolean") {
      keyClass = "booleanType";
    } else if (type === "Date") {
      keyClass = "dateType";
    } else if (type === "String") {
      keyClass = "stringType";
    } else if (type === "Number") {
      keyClass = "numberType";
    } else {
      keyClass = "otherType";
    }
    if (name !== "id" && name !== "_id") {
      HTMLString += '<div class="holder">';
      HTMLString += '<div class="keyName"><code>' + name + ":</code></div>";
      HTMLString += '<div class="keyType"><code>{ type : ' + '<span class="' + keyClass + '">' + type + "</span> }</code></div>";
      HTMLString += "</div>";
    }
  }
  return HTMLString += "</div></div>";
}





function friendly(model) {
  var form    = { filled: false }
    , Model   = typeof model._schema !== void 0 ? model : model.prototype
    , Schema  = cycle.decycle(Model.schema.paths)
    , copy    = { isRequired: "required" }
    , values  = Model["_doc"] || null
    , fields  = {}
  ;//============================================
  for (var field in Schema) {
    if (!Schema.hasOwnProperty(field)) continue;
    for (var prop in Schema[field]) {
      if (prop === "selected" && !field[prop]) continue;
    }
    fields[field] = {};
    for (var key in copy) {
      if (Schema[field][key] !== void 0) {
        fields[field][copy[key]] = Schema[field][key];
      }
    }
    var name      = field.split(".")
      , shortName = name
    ;//====================================
    if (name.length == 1) {
      fields[field]["name"] = name;
      fields[field]["shortName"] = name;
      if (values && values[name] !== void 0) {
        fields[field]["value"] = values[name];
        form.filled = true;
      }
    } else {
      fields[field]["shortName"] = name[name.length - 1];
      fields[field]["name"] = "[" + name.slice(1).join("][") + "]";
      fields[field]["name"] = name[0] + fields[field]["name"];
      if (values && values[name[0]][name[1]] !== void 0) {
        fields[field]["value"] = values[name[0]][name[1]];
        form.filled = true;
      }
    }
    var fieldtype = field.match(/(number|date|email|password|url|tlf)/gi) || "text";
    fields[field]["type"] = Schema[field].instance === "boolean" ? "checkbox" : fieldtype;
    fields[field]["type"] = Schema[field]["options"]["override"] !== void 0 ? Schema[field]["options"]["override"] : fieldtype;
    fields[field]["type"] = fields[field]["type"].toString();
    fields[field]["type"] = field[0] === "_" ? "hidden" : fields[field]["type"];
    if (Schema[field]["options"]["min"] !== void 0 && Schema[field]["options"]["min"] >= 50) {
      fields[field]["type"] = "textarea";
    }
    if (Schema[field]["options"]["max"] !== void 0) {
      fields[field]["max"] = Schema[field]["options"]["max"];
    }
    fields[field]["ignore"] = Schema[field].options.ignore || true;
  }
  form["fields"] = fields;
  if (values !== null) form["id"] = values["_id"];
  console.log(form)
  return form;
};