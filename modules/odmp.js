var EventEmitter = require("events").EventEmitter
  , fs        = require("fs")
  , pt        = require("path")
  , mongoose  = require("mongoose")
  , logger    = require("./logger")
  , streams   = require("./_orm/streams")
  , regex     = require("./_orm/regex")
  , qry       = require("./_orm/query")
  , $u        = require("./_orm/util")
;//===================================
exports = module.exports = create;

var Schema      = exports.Schema = mongoose.Schema
  , ObjectId    = mongoose.Schema.ObjectId
  , Mixed       = mongoose.Types.Mixed


;//===================================

function merge(a, b) { if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; }

function create(nm, options) {
  options = options || {};

  function odm(nm, options) {
    if (!odm.connection) odm.error("mongoose is required");

    return {
      __mounted: function (app) {
        odm.route(this.route, app);
      },
      handle: function (req, res, next) {
        res.contentType("json");
        next();
      },
      set: function (nested, path) {
        self[nested] = path;
      },
      emit: function (evt, app) {
        evt === "mount" && (this.__mounted(app));
      },
      routes: {}
    };
  }
  merge(odm, proto);


  odm.connection = options.connection;

  console.log(odm.connection);

  /*
  odm.connection = mongoose.createConnection();
  odm.open = function (nm, models) {
    this.connection.open("mongodb://localhost/" + nm);
    this.connection.once("connected", function () {
      odm.log.info("conn");
    });
    if (models) {
      odm.models = {};
      this._routes = Object.keys(models);
      $u.each(models, function (v, k) {
        odm.jsonSchema(k, v);
      });
    }
    return odm.connection;
  };
  */
  odm._routes = options.routes;
  odm.stream = options.stream || streams.JStream;
  odm.trans = options.trans   || streams.transit();
  odm.log = logger.create("odm");
  odm.error = odm.log.error;

  return odm;
}

var proto = {};

proto.routes = {};

proto.transit = function (strm, query, m) {
  return this.trans.pump(strm, m, query.trans);
};

proto.responseStream = function (strm, query, m) {
  return new this.stream() || streams.JStream;
};

proto.model = function (m) {
  var _cconnection = this.connection;

  Object(m) === m && (m = m.param || m.param("type"));
  return qry.model(_cconnection, m);
};

proto.run = function (meta, tostream) {
  if (!tostream) {
    tostream = meta;
    meta = {};
  }
  return this.responseStream(meta).procedure(tostream);
};

proto.find = function (m, fnd, req, res, next) {
  var self = this;
  var _single = req.query.single;
  return function (err, cnt) {
    if (err) return next(err);

    qry.populate(fnd, req.query);
    qry.paginate(fnd, req.query);
    qry.sort(fnd, req.query);
    var _stream = self.transit(self.createStream(fnd, req, res, next), req.query, m);
    if (req.query.filter && m) {
      qry.filter(fnd, req.query, m);
      fnd.count(function (err, fcnt) {
        if (err) return next(err);
        _stream.pipe(self.responseStream({
          total: cnt,
          filterTotal: fcnt
        }, _single)).pipe(res);
      });
    } else {
      _stream.pipe(self.responseStream({
        total: cnt
      }, _single)).pipe(res);
    }
  };
};

proto.createStream = function (query, req, res, next) {
  var self = this;
  var _stream = query.stream();
  _stream.on("error", function (err) {
    console.error("stream error [" + (err && err.message || "unknown") + "]");
    this.destroy();
    return self.err(err, req, res, next);
  });
  return _stream;
};

proto.route = function (nested, app) {
  var self = this
    , _nested = ["^\\/(" + this._routes.join("|") + ")", "\\/(?:([^\\/]+?))\\", "/(?:([^\\/]+?))(?:\\/([\\w\\/]+?))?\\/?$", "\\/?$", "\\/*"]
    , _search = "finder"
  ;//=================================


  console.log(self)



  app.get(RegExp(_nested[0] + _nested[4], "i"), function (req, res, next) {
    var _xpt = res.locals.expose
      , _rou = _xpt.route.split("/").slice(1)
      , _len = _rou.length
      , _mod
    ;//===================================
    self.log.info("pathing in odm", req.params[0], _len, _xpt);
    var _role = "name mail";
    if (_len === 1) {
      _mod = self.model(req.params[0]);
      return _mod.count({}, self.find(_mod, _mod.find({}).select(_role), req, res, next));


    } else if (_len === 2) {
      self.log.info("2", _rou[1]);
      next();
    } else if (_len === 3 && _rou[1] === _search) {
      self.log.info("3", _rou[2]);
      next();
    }
  });


  app.get(RegExp(_nested[0] +"\\/"+_search+ _nested[2], "i"), function (req, res, next) {
    var _xpt = res.locals.expose
      , _rou = _xpt.route.split("/").slice(1);

    req.params = _rou;



    var _f = req.params[0], _mod, _arg, _fnd;

    req.params.type = req.params[0];


    _mod = self.connection.models.user;

    console.log("--------------------");
    console.log(_mod);
    console.log("--------------------");

    console.error("[31m%s [0m: [31m[1m%j [0m", "ERR", _mod);

    _arg = [req.query];
    //if (req.params.length > 2) _arg = _arg.concat($u.splits(req.params[3]));
    _fnd = _mod[_f].apply(_mod, _arg);
    _fnd.count(self.find(_mod, _fnd, req, res, next));
  });


  app.get(RegExp(_nested[0] + _nested[1] + _nested[2]), function (req, res, next) {
    console.log("[31m%s [0m: [31m[1m%j %j [0m", "gets", req.params, res.locals.expose);
    var _sng = req.query.single
      , _mod = self.model(req.params[0])
      , _fnd = _mod.findOne(qry.oid(req.params[1]))
      , _cbs
    ;//============================================
    qry.populate(_fnd, req.query);
    var _pop = req.params.length > 1 ? req.params[2] : null;
    if (_pop) {
      qry.populate(_fnd, {
        populate: [_pop]
      });
      _cbs = new streams.CallbackStream();
      self.transit(self.createStream(_cbs, req, res, next), req.query, _mod).pipe(self.responseStream(null, _sng)).pipe(res);
      _fnd.exec(function (err, doc) {
        if (err) return _cbs.emit("error", err);
        $u.invoke(doc, _pop, _cbs.procedure());
      });
    } else {
      self.transit(self.createStream(_fnd, req, res, next), req.query, _mod).pipe(self.responseStream(null, _sng)).pipe(res);
    }
  });
  app.get(nested + "/:type?", function (req, res, next) {
    console.error("no haddle", req.url);
    res.send({
      status: 1,
      message: "No such url"
    });
  });
  app.post(nested + "/:type", function (req, res, next) {
    var _mod = self.model(req);
    new _mod(qry.clean(req.body)).save(self.run(res));
  });
  app.put(nested + "/:type/:id", function (req, res, next) {
    var id = req.param("id");
    self.model(req).findOne(qry.oid(req), function (err, obj) {
      if (err) return next(err);
      $u.extend(obj, qry.clean(req.body));
      obj.save(function (err, ret) {
        if (err) return next(err);
        var obj = ret.toJSON();
        res.send({
          status: 0,
          payload: obj
        });
      });
    });
  });
  app.del(nested + "/:type/:id?", function (req, res, next) {
    var _mod = self.model(req),
      _snd = function (err, o) {
        if (err) return next(err);
        res.send({
          status: 0,
          payload: null
        });
      };
    _mod.findOne(qry.oid(req), function (err, doc) {
      if (err) return next(err);
      doc.remove(_snd);
    });
  });
};

proto.jsonSchema = function (k, v, report) {
  !$u.is.str(k) && err("expected string for param name");
  !$u.is.obj(v) && err("expected object for param desc");
  if (!this.connection) err("expected a mongoose.Connection params. Call setConnection() before schema()");
  var o = this.convert(v.schm || v.schema);
  var schema = new Schema(o);
  return this.models[k] = mongoose.model(k, schema);
};

proto.convert = function convert(desc) {
  var l = desc;
  return JSON.parse(JSON.stringify(desc), function (k, v) {
    if ("type" === k) {
      v === "e" && (v = "s", this.validate = proto.gen.get("v", "email")());
      v === "u" && (v = "s", this.validate = proto.gen.get("v", "url")());
      return proto.gen.type(v);
    } else if (/^(view)/.test(k)) {
      console.log(k, v);
      v = null;
    } else if (/^(validate|get|set|default|match)/.test(k)) {
      v = v.split(":");
      return k === "" ? v : proto.gen.get(k, v[0])(v[1]);
    } else if (/^(lowercase|uppercase|trim|mat|enum|min|max|ref|type|default|required|select|get|set|index|unique|sparse|validate)/.test(k)) {
      return v;
    } else {
      console.log("[32m%s [0m: [32m[1m%s [0m", "x:", k);
    }
    if (k === "options" || !v) {
      delete l;
    } else {
      return v;
    }
  });
};

proto.gen = {
  hash: {
    validator: regex.validator,
    setter: {},
    getter: {},
    "default": {}
  },
  set: function (p, k, v) {
    var _hash = {
      v: proto.gen.hash.validator,
      d: proto.gen.hash["default"],
      s: proto.gen.hash.setter,
      g: proto.gen.hash.getter
    }[p[0]][k];
    return v ? _hash = v : _hash;
  },
  get: function (p, k) {
    return proto.gen.set(p, k);
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
  tags: function (v) {}
};
