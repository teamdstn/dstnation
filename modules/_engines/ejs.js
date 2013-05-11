var ejs = require("ejs")
  , fs = require("fs")
  , pt = require("path")
;
var renderFile = module.exports = function (file, options, fn) {
    if (!options.locals) {
      options.locals = {};
    }
    if (!options.locals.blocks) {
      var blocks = {
        scripts: new Block(),
        stylesheets: new Block()
      };
      options.locals.blocks       = blocks;
      options.locals.scripts      = blocks.scripts;
      options.locals.stylesheets  = blocks.stylesheets;

      options.locals.block        = block.bind(blocks);
      options.locals.stylesheet   = stylesheet.bind(blocks.stylesheets);
      options.locals.script       = script.bind(blocks.scripts);
    }
    options.locals.layout         = layout.bind(options);
    options.locals.include        = include.bind(options);
    options.locals.partial        = partial.bind(options);

    ejs.renderFile(file, options, function (err, html) {
      if (err) {
        return fn(err, html);
      }
      var layout = options.locals._layoutFile;
      if (layout === undefined) {
        layout = options._layoutFile;
      }
      if (layout) {
        var engine = options.settings["view engine"] || "ejs"
          , desiredExt = "." + engine
        //;===================================
        if (layout === true) {
          layout = pt.sep + "layout" + desiredExt;
        }

        if (pt.extname(layout) !== desiredExt) {
          layout += desiredExt;
        }
        delete options.locals._layoutFile;
        delete options._layoutFile;
        delete options.filename;
        if (layout.length > 0 && layout[0] === pt.sep) {
          layout = pt.join(options.settings.views, layout.slice(1));
        } else {
          layout = pt.resolve(pt.dirname(file), layout);
        }
        options.locals.body = html;
        renderFile(layout, options, fn);
      } else {
        fn(null, html);
      }
    });
  };

var cache = {};

function resolveObjectName(view) {
  return cache[view] || (cache[view] = view.split("/").slice(-1)[0].split(".")[0].replace(/^_/, "").replace(/[^a-zA-Z0-9 ]+/g, " ").split(/ +/).map(function (word, i) {
    return i ? word[0].toUpperCase() + word.substr(1) : word;
  }).join(""));
}

function lookup(root, partial, options) {

  var engine = options.settings["view engine"] || "ejs"
    , desiredExt = "." + engine
    , ext = pt.extname(partial) || desiredExt
    , key = [root, partial, ext].join("-")
  ;//===============================================

  if (options.cache && cache[key]) return cache[key];

  var dir   = pt.dirname(partial)
    , base = pt.basename(partial, ext);
  ;//==============================================
  partial = pt.resolve(root, dir, "_" + base + ext);
  if (fs.exists(partial)) return options.cache ? cache[key] = partial : partial;
  partial = pt.resolve(root, dir, base + ext);
  if (fs.exists(partial)) return options.cache ? cache[key] = partial : partial;
  partial = pt.resolve(root, dir, base, "index" + ext);
  if (fs.exists(partial)) return options.cache ? cache[key] = partial : partial;
  return null;
}

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
    } else if (options.object !== undefined) {
      object = options.object;
      delete options.object;
    }
  } else {
    options = {};
  }
  if (locals) options.__proto__ = locals;
  for (var k in this) options[k] = options[k] || this[k];
  name = options.as || resolveObjectName(view);

  var root = pt.dirname(options.filename)
    , file = lookup(root, view, options)
    , key = file + ":string"
  ;//==================================================

  if (!file) throw new Error("Could not find partial " + view);
  var source = options.cache ? cache[key] || (cache[key] = fs.readFileSync(file, "utf8")) : fs.readFileSync(file, "utf8");
  options.filename = file;

  function render() {
    if (object) {
      if ("string" == typeof name) {
        options[name] = object;
      } else if (name === global) {}
    }
    var html = ejs.render(source, options);
    return html;
  }
  if (collection) {
    var len = collection.length,
      buf = "",
      keys, prop, val, i;
    if ("number" == typeof len || Array.isArray(collection)) {
      options.collectionLength = len;
      for (i = 0; i < len; ++i) {
        val = collection[i];
        options.firstInCollection = i === 0;
        options.indexInCollection = i;
        options.lastInCollection = i === len - 1;
        object = val;
        buf += render();
      }
    } else {
      keys = Object.keys(collection);
      len = keys.length;
      options.collectionLength = len;
      options.collectionKeys = keys;
      for (i = 0; i < len; ++i) {
        prop = keys[i];
        val = collection[prop];
        options.keyInCollection = prop;
        options.firstInCollection = i === 0;
        options.indexInCollection = i;
        options.lastInCollection = i === len - 1;
        object = val;
        buf += render();
      }
    }
    return buf;
  } else {
    return render();
  }
}

function layout(view) {
  this.locals._layoutFile = view;
}

function include(view) {
  var root = pt.dirname(this.filename)
    , engine = this.settings["view engine"] || "ejs"
    , desiredExt = "." + engine
    , ext = pt.extname(view)
    , file = pt.join(root, view + (ext ? "" : desiredExt))
    , key = file + ":string"
  ;//=========================================

  var source = this.cache ? cache[key] || (cache[key] = fs.readFileSync(file, "utf8")) : fs.readFileSync(file, "utf8");
  this.filename = file;
  return ejs.render(source, this);
}

function Block() {
  this.html = [];
}

Block.prototype = {
  toString: function () {
    return this.html.join("\n");
  },
  append: function (more) {
    this.html.push(more);
  },
  prepend: function (more) {
    this.html.unshift(more);
  },
  replace: function (instead) {
    this.html = [instead];
  }
};

function block(name, html) {
  var blk = this[name];
  if (!blk) {
    blk = this[name] = new Block();
  }
  if (html) {
    blk.append(html);
  }
  return blk;
}

function script(path, type) {
  if (path) {
    this.append('<script src="' + path + '"' + (type ? 'type="' + type + '"' : "") + "></script>");
  }
  return this;
}

function stylesheet(path, media) {
  if (path) {
    this.append('<link rel="stylesheet" href="' + path + '"' + (media ? 'media="' + media + '"' : "") + " />");
  }
  return this;
}
