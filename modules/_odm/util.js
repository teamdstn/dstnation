var fs = require("fs")
  , pt = require("path")
;//==================================
var __Array = Array.prototype, __Object = Object.prototype, slice = __Array.slice, keys = Object.keys, toString=Object.prototype.toString, hasOwnProperty  = Object.prototype.hasOwnProperty;
var each = exports.each = function (o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); };
var is = exports.is = {"arr": __Array.isArray || function (o) { return toString.call(o) == "[object Array]";}, "obj":function (obj) { return obj === Object(obj);}}
each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (nm) { is[nm.slice(0,3).toLowerCase()] = function (o) { return toString.call(o) == "[object " + nm + "]"; }; });

exports.enm = function(c, a, b) {
  var d = (toString.call(a).slice(8, - 1)).toLowerCase(), p;
  if (void 0 !== b) {
    if (" " === b) return String(c).replace(RegExp("^" + b + "+|" + b + "+$", "g"), "");
    //if ("mat" === b) return c.match(a);
    if (/r|rb|l|lb|has /.test(b)){
      if (b.length==3) return hasOwnProperty.call(c, a);
      p = b.length==1 ? c.indexOf(a) : c.lastIndexOf(a);
      if(!~p) return c;
      if(b[0]=="l") return c.slice(0, p);
      if(b[0]=="r") return c.slice(p, c.length);
    }
    if ("Number" === toString.call(a + b).slice(8, - 1)) return 0 === a + b ? slice.call(c) : slice.call(c, a, b);
    "String" === d && (a = String(a));
    return true === b ? -1 !== a.indexOf(c) : a.indexOf(c) === Number(b);
  }
  return -1 !== d.indexOf(c);
}

exports.readJSON = function(fl, isd, cb) {
  is.fun(isd) && (cb=isd, isd=false);
  if(!is.fun(cb)) return console.error("needs a callback");
  function _read(nm, next){
    fs.readFile(nm, "utf-8", function(err, data) {
      if (err) {
        next(err);
      }else{
        try {
          var _data = JSON.parse(data);
          next(null, {name: pt.basename(nm), data:_data});
        } catch (err) {
          return next(err);
        }
      }
    });
  }
  if(isd){
    fs.readdirSync(fl).forEach(function(fm) {
      _read(fl+pt.sep+fm, cb)
    })
  }else{
    return _read(fl, cb);
  }
};

exports.trim = function(str, c){
  if (!c && String.prototype.trim) return String.prototype.trim.call(str);
  c = c || "";
  return String(str).replace(new RegExp('\^' + c + '+|' + c + '+$', 'g'), '');
}

exports.stripExt = function(s) {
  return s.substr(0, s.length - pt.extname(s).length)
}

exports.extend = function (obj) {
  each(slice.call(arguments, 1), function (source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
  });
  return obj;
};

exports.strin = function(str, ndl) {
  if (ndl === '') return true;
  if (str == null) return false;
  return String(str).indexOf(ndl) !== -1;
}

exports.filter = function (obj, iterator, context) {
  var results = [];
  if (obj == null) return results;
  if (__Array.filter && obj.filter === __Array.filter) return obj.filter(iterator, context);
  each(obj, function (value, index, list) {
    if (iterator.call(context, value, index, list)) results[results.length] = value;
  });
  return results;
};

exports.first = function (array, n, guard) {
  return n != null && !guard ? slice.call(array, 0, n) : array[0];
};

exports.setunless = function (obj, str, val) {
  var orig = getsafe(obj, str);
  if (orig == null) return depth(obj, str, val);
  return orig;
};

exports.merge = function(a, b) { if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; };
var splits = exports.splits = function (val, delim, ret) {
  ret = ret || [];
  delim = delim || ",";
  if (!val) return ret;
  if (is.arr(val)) {
    val.forEach(function (v) {
      splits(v, delim, ret);
    });
  } else {
    val.split(delim).forEach(function (v) {
      ret.push(v);
    });
  }
  return ret;
};

var getsafe = exports.getsafe = function (obj, str) {
  if (!obj) return null;
  if (!is.arr(str)) return getsafe(obj, str.split("."));
  if (!str.length) return null;
  var p = str.shift();
  var n = p in obj ? obj[p] : null;
  return str.length ? getsafe(n, str) : n;
};

var depth = exports.depth = function (obj, sp, val) {
  if (!is.arr(sp)) return depth(obj, sp.split("."), val);
  var c = sp.shift();
  if (typeof obj[c] == "undefined") obj[c] = sp.length ? {} : val == void 0 ? {} : val;
  if (sp.length) return depth(obj[c], sp, val);
  return obj[c];
};

function findById(obj, value) {
  var field = "_id";
  return exports.first(exports.filter(obj, function (v, k) { return v[field] == value; }));
};

var invoke = exports.invoke = function(obj, str, cb) {
  var resp, current;
  if (str && !Array.isArray(str)) return invoke(obj, str.split(/\/+?/gi), cb);
  if (obj instanceof Error) return cb(obj, null);
  current = str.shift();
  if (obj instanceof Function) {
    try {
      resp = obj.call(null, current);
    } catch (err) {
      return cb(err, null);
    }
  } else {
    if (typeof current == "undefined") return cb(null, obj);
    if (Array.isArray(obj)) {
      var id = current, idx = parseInt(id);
      if (!isNaN(idx) && idx > -1 && idx < obj.length) {
        resp = obj[idx];
      } else {
        resp = findById(obj, id);
      }
    } else if (current in obj) {
      resp = obj[current];
    } else {
      console.log("Not sure what to do with ", obj, typeof obj, current, str);
    }
  }
  if (resp instanceof Function) {
    var oresp = resp, _obj = obj;
    resp = function onFunctionWrapper() {
      return oresp.apply(_obj, slice.call(arguments, 0));
    };
  }
  return invoke(resp, str, cb);
};

exports.emptyToSparse = function emptyToSparse(str) {
  return !str || !str.length ? undefined : str;
}
exports.validatePresenceOf = function validatePresenceOf(value) {
  return value && value.length;
}
exports.nestedPath = function nestedPath(obj, path, val) {
  if (typeof obj !== "object") {
    return obj;
  }
  var keys = path.split(".");
  if (keys.length > 1) {
    path = keys.shift();
    return nestedPath(obj[path], keys.join("."), val);
  }
  if (val !== undefined) {
    obj[path] = val;
  }
  return obj[path];
}

exports.dataToObjects = function dataToObjects(data) {
  if (!data) return null;
  if (data instanceof Array) {
    return data.map(function (doc) {
      return doc.toObject();
    });
  }
  return data.toObject();
}


exports.objectOrFunction = function objectOrFunction(obj) {
  if (toString.call(obj) == "[object Function]") {
    return obj();
  }
  return obj;
}
exports.dropDatabase = function dropDatabase(db, fn) {
  db.connection.db.executeDbCommand({
    dropDatabase: 1
  }, function (err, result) {
    db.disconnect();
    fn && fn(err, result);
  });
}
exports.dropCollections = function dropCollections(db, each, fn) {
  if (each && !fn) {
    fn = each;
    each = null;
  }
  var conn = db.connection
    , cols = Object.keys(conn.collections);
  cols.forEach(function (name, k) {
    console.log("name: ", name, k);
    conn.collections[name].drop(function (err) {
      if (err == "ns not found") {
        err = null;
      }
      each && each(err, name);
    });
  });
  fn && fn(null);
}
exports.esignature = function (type) {
  if (typeof type === "undefined") {
    type = "html";
  }
  var sig = "";
  switch (type) {
  case "html":
    sig = "" + "<p>Thank you,</p>" + "--" + "<p>(Insert Company Name)</p>" + "<p><i>If you received this message in error, please forward it to: (insert site email)</i></p>";
    break;
  case "text":
    sig = "" + "Thank you,\n\n" + "--\n\n" + "(Insert Company Name)\n" + "If you received this message in error, please forward it to: (insert site email)";
    break;
  }
  return sig;
};
exports.chkitem = function (req, res, next) {
  if (!req.param("item_id")) {
    res.redirect("/");
  } else {
    next();
  }
};
exports.groupCount = function (spec, cb) {
  this.count(spec, function (err, count) {
    if (err) console.log(err);
    var n = count;
    cb(err, n);
  });
};
exports.access = function (db) {
  return function (groupName) {
    return function (req, res, next) {
      if (req.loggedIn) {
        if (req.route.path === "/login") {
          if (req.session.redirectTo) {
            var redirectTo = req.session.redirectTo;
            delete req.session.redirectTo;
            res.redirect(redirectTo);
          } else {
            req.flash("notice", "You are already logged in");
            res.redirect("/");
          }
        } else {
          if (typeof groupName === "undefined") {
            next();
          } else {
            var Users = db.model("Users");
            Users.findById(req.session.auth._id).populate("_group").run(function (err, user) {
              if (err) {
                req.flash("error", err);
                return res.redirect("/");
              }
              if (user) {
                if (typeof user._group !== "undefined" && typeof user._group._id !== "undefined") {
                  if (groupName instanceof Array) {
                    var _ = require("underscore");
                    if (_.indexOf(groupName, user._group.id) !== -1) {
                      next();
                      return;
                    }
                  } else {
                    if (groupName === user._group.id || groupName === "super_admin") {
                      next();
                      return;
                    }
                  }
                }
                req.flash("error", "Your group does not have permissions for this request");
                res.redirect("/");
              } else {
                req.flash("error", "Your account is not currently accessible");
                res.redirect("/logout");
              }
            });
          }
        }
      } else {
        if (req.route.path === "/login") {
          next();
        } else {
          req.session.redirectTo = req.route.path;
          res.redirect("/login");
        }
      }
    };
  };
};
exports.DatabaseCleaner = function (type) {
  var cleaner = {};
  cleaner["mongodb"] = function (db, callback) {
    db.collections(function (skip, collections) {
      var count = collections.length;
      if (count < 1) {
        return callback.apply();
      }
      collections.forEach(function (collection) {
        collection.drop(function () {
          if (--count <= 0 && callback) {
            callback.apply();
          }
        });
      });
    });
  };
  cleaner["redis"] = function (db, callback) {
    db.flushdb(function (err, results) {
      callback.apply();
    });
  };
  cleaner["couchdb"] = function (db, callback) {
    db.destroy(function (err, res) {
      db.create(function (err, res) {
        callback.apply();
      });
    });
  };
  cleaner["mysql"] = function (db, callback) {
    db.query("show tables", function (err, tables) {
      var count = 0;
      var length = tables.length;
      tables.forEach(function (table) {
        if (table["Tables_in_database_cleaner"] != "schema_migrations") {
          db.query("DELETE FROM " + table["Tables_in_database_cleaner"], function () {
            count++;
            if (count >= length) {
              callback.apply();
            }
          });
        } else {
          count++;
          if (count >= length) {
            callback.apply();
          }
        }
      });
    });
  };
  this.clean = function (db, callback) {
    cleaner[type](db, callback);
  };
};
