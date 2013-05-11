var fs        = require("fs")
  , pt        = require("path")
  , monit     = require("./monit")
  , traverse  = require("./traverse")
  , cache     = {}
  , requires  = {}
;

exports.clearCache = function () {
  cache = {};
};

function trim(str, cha) {
  return String(str).replace(new RegExp('\^' + cha + '+|' + cha + '+$', 'g'), '');
};

function underscored(str) {
  return trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
};

function each(o, i) {
  Object.keys(o).forEach(function (k) {
    i(o[k], k, o);
  });
}

function buildDef(a, b) {
  return each(a, function (v, k) {
    if (Array.isArray(v)) {
      b[k] = v.join(' ');
    } else {
      b[k] = "<%# def." + underscored(v) + " %>";
    }
  })
}

function read(path, options, fn) {
  options = options || {};
  var str = cache[path];
  if (options.cache && str && typeof str === "string") return fn(null, str);
  fs.readFile(path, "utf8", function (err, str) {
    if (err) return fn(err);
    if (options.cache) cache[path] = str;
    fn(null, str);
  });
}


var cachep = exports.cachep = function (s, p, v) {
    "string" === typeof s && (v = p, p = s, s = cache), p = p.split(":");
    var k, i;
    for (i in p) {
      k = p[i];
      if (!s[k]) {
        s[k] = ((+i + 1 === p.length) ? v : {});
      };
      s = s[k];
    }
  }

  function monitor(path, cbs) {
    cbs = cbs || {};
    var _monit = monit.fw.watch(path, { /*ignored: /^\./, */
      persistent: true
    });
    _monit.on('add', function (path) {
      monit.log.info('engine', path, 'has been added');
    }).on('change', function (path) {
      monit.log.info('engine', path, 'has been changed');
      cbs.c && cbs.c(path);
    }).on('unlink', function (path) {
      monit.log.info('engine', path, 'has been removed');
    }).on('error', function (error) {
      monit.log.error('Error happened', error);
    })
    //_monit.add(pt.join(__dirname, '/.env/development.json'));
  }

exports.preset = function (name, options) {
  options.cache = false;
  var engine = requires[name] = (requires.dtml = require("./_engines/" + name));
  var chgBack = function (path) {
      read(path, {}, function (e, str) {
        cache.dtml = {};
        var __def = {};
        engine.defines(str, __def), cachep(name + ":parts", __def);
      })
    }


  options.monit && (monitor(options.path, {
    c: chgBack
  }));
  chgBack(options.path);
  /*
  for (var i = 0, len = options.pred.length; i < len; i++) {
    read(normalize(options.path ? options.path + "/" + options.pred[i] : options.pred[i]), options, function (err, doc) {
      if (!err) {
        var __def = caches.def = caches.def || {};
        engine.defines(doc, __def);
      }
    });
  }
  */
  return exports[name];
}

exports.dtml = function (path, options, fn) {
  options = options || {cache: true,def: {} };

  options.each      = each;
  options.traverse  = traverse;

  var engine = requires.dtml || (requires.dtml = require("./_engines/dtml")),__def, _dir = pt.dirname(path);
  cache.dtml && (__def = cache.dtml.parts);
  //__def.submenu = __def.contents = __def.sidemenu = "";

  if (options.cache && tmpl && "function" == typeof tmpl) {
    try {
      var html = tmpl(options);
      fn(null, html);
    } catch (err) {
      fn(err);
    }
  } else {
    read(path, options, function (err, str) {
      if (err) return fn(err);
      try {
        options.filename = path;
        if (options.frame) {}
        else {

          function define(o, nm) {
            __def[nm] = "";
            console.time(nm)
            for (var i=0, len = o.length; i < len; ++i) {
              var x = o[i].t;
              var k = nm + "_" + x;
              if (cache[k]) {
                _str = cache[k];
              } else if (pt.extname(k) === ".dtml") {
                cache[k] = fs.readFileSync(pt.join(_dir, x), "utf-8");
              } else {
                __def[nm] += engine.render(__def[x], {data:o[i].o, g:options.expose.g});
              }
            }
            console.timeEnd(nm)
          }

          options.expose.g = {};
          options.expose.g.lang = "en";
          options.expose.g.title = "teamdstn";

          var _str;
          each(options.expose.def, define);
          /*
          var _page = options.expose && options.expose.page ? underscored(options.expose.page) : "ncr";
          //__def.contents = __def.contents[_page] ? "<%# def." + _page + " %>" : "";
          //console.log(_page, __def.contents);
          if (__def[_page] !== void 0) {
            var spl = __def[_page].split("[^gdata]");
            if (spl.length === 3) {
              var gdata = JSON.parse(spl.slice(1, spl.length - 1)[0]);
              gdata.defs && buildDef(gdata.defs, __def);
              gdata.cls && (options.expose.cls = gdata.cls);
            }
          }
          */
        }


        var tmpl = engine.compile(str, __def);

        fn(null, tmpl(options));
      } catch (err) {
        fn(err);
      }
    });
  }
}

exports.underscore = function (path, options, fn) {
  var engine = requires.underscore || (requires.underscore = require("underscore"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      var tmpl = engine.template(str, null, options);
      fn(null, tmpl(options).replace(/\n$/, ""));
    } catch (err) {
      fn(err);
    }
  });
};

exports.jade = function (path, options, fn) {
  var engine = requires.jade || (requires.jade = require("jade"));
  engine.renderFile(path, options, fn);
};

exports.dust = function (path, options, fn) {
  var engine = requires.dust;
  if (!engine) {
    try {
      requires.dust = require("dust");
    } catch (err) {
      requires.dust = require("dustjs-linkedin");
    }
    engine = requires.dust;
    engine.onLoad = function (path, callback) {
      read(path, options, callback);
    };
  }
  var tmpl = cache[path];
  if (options.cache && tmpl && "function" == typeof tmpl) {
    tmpl(options, fn);
  } else {
    read(path, options, function (err, str) {
      if (err) return fn(err);
      try {
        options.filename = path;
        tmpl = engine.compileFn(str);
        if (options.cache) cache[path] = tmpl;
        else engine.cache = {};
        tmpl(options, fn);
      } catch (err) {
        fn(err);
      }
    });
  }
};

exports.swig = function (path, options, fn) {
  var engine = requires.swig || (requires.swig = require("swig"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
};
exports.liquor = function (path, options, fn) {
  var engine = requires.liquor || (requires.liquor = require("liquor"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
};
exports.ejs = require("./_engines/ejs");

exports.jqtpl = function (path, options, fn) {
  var engine = requires.jqtpl || (requires.jqtpl = require("./_engines/jqtpl"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      engine.template(path, str);
      fn(null, engine.tmpl(path, options));
    } catch (err) {
      fn(err);
    }
  });
};
exports.haml = function (path, options, fn) {
  var engine = requires.hamljs || (requires.hamljs = require("hamljs"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      options.locals = options;
      fn(null, engine.render(str, options).trimLeft());
    } catch (err) {
      fn(err);
    }
  });
};

exports.hogan = function (path, options, fn) {
  var engine = requires.hogan || (requires.hogan = require("hogan.js"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      var tmpl = engine.compile(str, options);
      fn(null, tmpl.render(options));
    } catch (err) {
      fn(err);
    }
  });
};
exports.handlebars = function (path, options, fn) {
  var engine = requires.handlebars || (requires.handlebars = require("handlebars"));
  read(path, options, function (err, str) {
    if (err) return fn(err);
    try {
      options.filename = path;
      var tmpl = engine.compile(str, options);
      fn(null, tmpl(options));
    } catch (err) {
      fn(err);
    }
  });
};
