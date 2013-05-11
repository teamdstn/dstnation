var mongoose = require("mongoose")
  , $u = require("./util");


exports.oid = function oid(req) {
  var id = req.params && req.params.id || req.body && req.body._id || req;
  if (!id) throw new Error("id not in request or body");
  var resp = {
    _id: id
  };
  return resp;
}

exports.model = function(conn, req) {
  var type = (req.params && req.params.type || req);

  if(!type) return console.error("could not locate schema for []");
  if (Object.keys(conn.base.modelSchemas).some(function (v, k) {
    if (v.toLowerCase() == type) {
      type = v;
      return true;
    }
  })) {
    return conn.model(type);
  } else {
    return console.error("could not locate schema for [" + type + "]");
  }
}

exports.clean = function(query) {
  var update = $u.extend({}, query);
  delete update._id;
  delete update.created_at;
  delete update.modified_at;
  delete update.modified_by;
  delete update.created_by;
  return update;
}

exports.paginate = function (qry, query) {
  var limit = Math.min(query && query.limit && 0 + query.limit || 100, 1e3)
    , skip = query && query.skip || 0;

  if (query) delete query.limit;
  if (query) delete query.skip;

  return qry.skip(skip).limit(limit);
}


exports.filter = function(qry, query, mod) {
  if (!query.filter) return qry;
  var paths = $u.getsafe(mod, "options.display.fieldOrder") || [], ors = [];
  paths.length === 0 && mod.schema.eachPath(function (p, v) { paths.push(p); });
  if (typeof query.filter == "string") {
    var regex = { $regex: new RegExp(query.filter, "i") };
    mod.schema.eachPath(function (p, v) {
      if (paths.indexOf(p) > -1 && typeof v.options && v.options.type === "string") {
        var b = {};
        b[p] = regex;
        ors.push(b);
      }
    });
  } else {
    $u.each(query.filter, function (v, k) {
      if (mod.schema.paths[k]) {
        var b = {};
        b[k] = { $regex: new RegExp(v, "i") };
        ors.push(b);
      }
    });
  }
  qry.or(ors);
  return qry;
}

exports.populate = function(qry, query) {
  if (!(query && query.populate)) return qry;
  if (Array.isArray(query.populate) || typeof query.populate == "string") {
    var populate = $u.splits(query.populate);
    for (var i = 0, l = populate.length; i < l; i++) qry.populate(populate[i]);
  } else {
    $u.each(query.populate, function (v, k) {
      qry.populate(k, $u.splits(v));
    });
  }
  delete query.populate;
  return qry;
}

exports.sort = function(qry, query) {
  if (!(query && query.sort)) return qry;

  $u.splits(query.sort).forEach(function (v, k) {
    var parts = v.split(":", 2);
    if (parts.length == 1) parts.push(1);
    var _s = {};
    _s[parts[0]] = parts[1];
    qry.sort(_s);
  });

  delete query.sort;
  return qry;
}
