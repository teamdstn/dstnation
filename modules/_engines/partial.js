var pt = require("path")
  , fs = require("fs")
  , exists    = fs.existsSync
  , resolve   = pt.resolve
  , dirname   = pt.dirname
  , extname   = pt.extname
  , basename  = pt.basename
;//=============================
module.exports = function () {
  return function (req, res, next) {
    res.partial = res.render;
    res.locals.partial = partial.bind(res);
    var _render = res.render.bind(res);
    res.render = function (name, options, fn) {
      var layout = options && options.layout;
      if (layout === true || layout === undefined) layout = "layout";
      if (layout) {
        _render(name, options, function (err, body) {
          if (err) return fn ? fn(err) : req.next(err);
          options = options || {};
          options.body = body;
          var ext = extname(name) || "." + (res.app.get("view engine") || "ejs");


          var root = req.app.get("views") || process.cwd() + "/views";



          var dir = dirname(name) == "." ? root : resolve(root, dirname(name));
          layout = dirname(lookup(dir, layout, ext)) + (pt.sep || "/") + basename(layout, ext) + ext;
          _render(layout, options, fn);
        });
      } else {
        _render(name, options, fn);
      }
    };
    next();
  };
};

function register(ext, render) {
  if (ext[0] != ".") {
    ext = "." + ext;
  }
  if (typeof render == "string") {
    render = require(render);
  }
  if (typeof render.render != "undefined") {
    register[ext] = render.render;
  } else {
    register[ext] = render;
  }
}

module.exports.register = register;

function renderer(ext) {
  if (ext[0] !== ".") {
    ext = "." + ext;
  }
  return register[ext] != null ? register[ext] : register[ext] = require(ext.slice(1)).render;
}

module.exports.renderer = renderer;

var cache = {};

function resolveObjectName(view) {
  return cache[view] || (cache[view] = view.split(pt.sep || "/").slice(-1)[0].split(".")[0].replace(/^_/, "").replace(/[^a-zA-Z0-9 ]+/g, " ").split(/ +/).map(function (word, i) {
    return i ? word[0].toUpperCase() + word.substr(1) : word;
  }).join(""));
}

function lookup(root, view, ext) {
  var name = resolveObjectName(view);
  view = resolve(root, view + ext);
  if (exists(view)) return view;
  view = resolve(root, "_" + name + ext);
  if (exists(view)) return view;
  view = resolve(root, name, "index" + ext);
  if (exists(view)) return view;
  view = resolve(root, "..", name, "index" + ext);
  if (exists(view)) return view;
  view = resolve(root, name + ext);
  if (exists(view)) return view;
  return null;
}

module.exports.lookup = lookup;

function partial(view, options) {
  var collection, object, locals, name;
  if (options) {
    if (options.collection) {
      collection = options.collection;
      delete options.collection;
    } else if ("length" in options) {
      collection = options;
      options = {};
    }
    if (options.locals) {
      locals = options.locals;
      delete options.locals;
    }
    if ("Object" != options.constructor.name) {
      object = options;
      options = {};
    } else if (options.object != undefined) {
      object = options.object;
      delete options.object;
    }
  } else {
    options = {};
  }
  if (locals) options.__proto__ = locals;
  for (var k in this.app.locals) options[k] = options[k] || this.app.locals[k];
  for (var k in this.req.res.locals) options[k] = options[k] || this.req.res.locals[k];
  options.partial = partial.bind(this);
  name = options.as || resolveObjectName(view);
  var root = this.app.get("views") || process.cwd() + "/views",
    ext = extname(view) || "." + (this.app.get("view engine") || "ejs"),
    file = lookup(root, view, ext);
  var source = fs.readFileSync(file, "utf8");

  function render() {
    if (object) {
      if ("string" == typeof name) {
        options[name] = object;
      } else if (name === global) {}
    }
    return renderer(ext)(source, options);
  }
  if (collection) {
    var len = collection.length,
      buf = "",
      keys, key, val;
    if ("number" == typeof len || Array.isArray(collection)) {
      options.collectionLength = len;
      for (var i = 0; i < len; ++i) {
        val = collection[i];
        options.firstInCollection = i == 0;
        options.indexInCollection = i;
        options.lastInCollection = i == len - 1;
        object = val;
        buf += render();
      }
    } else {
      keys = Object.keys(collection);
      len = keys.length;
      options.collectionLength = len;
      options.collectionKeys = keys;
      for (var i = 0; i < len; ++i) {
        key = keys[i];
        val = collection[key];
        options.keyInCollection = key;
        options.firstInCollection = i == 0;
        options.indexInCollection = i;
        options.lastInCollection = i == len - 1;
        object = val;
        buf += render();
      }
    }
    return buf;
  } else {
    return render();
  }
}
