var EventEmitter = require("events").EventEmitter
  , fs        = require("fs")
  , pt        = require("path")
  , mongoose  = require("mongoose")
  , logger    = require("./logger")
  , streams   = require("./_odm/streams")
  , regex     = require("./_odm/regex")
  , qry       = require("./_odm/query")
  , $u        = require("./_odm/util")
  , gen       = require("./_odm/gen")
;//===================================
exports = module.exports = create;
var Schema      = exports.Schema = mongoose.Schema
  , ObjectId    = mongoose.Schema.ObjectId
  , Mixed       = mongoose.Types.Mixed
  , keys        = Object.keys
;//===================================
function merge(a, b) { if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; }
function err(e, req, res, next) { console.error("[31m%s [0m: [31m[1m%s [0m", "E", e); return res.send(e); };
function isObject(obj) {
  return !Array.isArray(obj) && Object(obj) === obj;
}




function create(nm, options) {
  options = options || {};
  function odm(nm, options) {
    if (!odm.db) odm.error("mongoose is required");
    return {
      __mounted: function (app) {
        odm.route(this.route, app);
      },
      handle: function (req, res, next) {
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
  odm.db = options.db || mongoose.createConnection();
  !odm.db._hasOpened && (odm.db.open("mongodb://localhost/"+nm))
  odm.db.once("connected", function(err){
  });


  odm.models = options.models;
  odm._routes = Object.keys(odm.models);
  odm.stream = options.stream || streams.JStream;
  odm.trans = options.trans   || streams.transit();
  odm.log = logger.create("odm");
  odm.error = err;

  console.log(odm.models.branch.schema.tree)


  return odm;
}
var proto = {};
proto.routes = {};
proto.transit = function (strm, query, m) {
  return this.trans.pump(strm, m, query.trans);
};
proto.responseStream = function (strm, query) {
  return new this.stream() || streams.JStream(strm, query);
};
proto.renderStream = function (strm, query, dest) {
  return new streams.RStream(strm, query, dest);
};
proto.model = function (m) {
  var _cconnection = this.connection || this.db;
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
  var _single = req.query.single || true;
  return function (err, cnt) {
    if (err) return next(err);
    try {
      qry.populate(fnd, req.query);
      qry.paginate(fnd, req.query);
      qry.sort(fnd, req.query);
      var _stream = self.transit(self.createStream(fnd, req, res, next), req.query, m);
      if (req.query.filter && m) {
        qry.filter(fnd, req.query, m);
        fnd.count(function (err, fcnt) {
          if (err) return next(err);
          _stream.pipe(self.renderStream({total: cnt, filterTotal: fcnt}, _single, res)).pipe(res);
        });
      } else {
        _stream.pipe(self.renderStream({total:cnt}, _single, res)).pipe(res);
      }
    } catch (err) {
      self.error(err, req, res, next);
    }
  };
};

proto.createStream = function (query, req, res, next) {
  var self = this;
  var _stream = query.stream();
  _stream.on("error", function (err) {
    console.error("stream error [" + (err && err.message || "unknown") + "]");
    this.destroy();
    return self.error(err, req, res, next);
  });
  return _stream;
};

proto.route = function (nested, app) {
  var self = this
    , _nested = ["^\\/(" + this._routes.join("|") + ")", "\\/(?:([^\\/]+?))\\", "/(?:([^\\/]+?))(?:\\/([\\w\\/]+?))?\\/?$", "\\/?$", "\\/*", "\\/*"]
    , _search = "find"
  ;//=================================
  /*
  /rest/blogpost
  /rest/blogpost?skip=1&limit=1
  /rest/blogpost?sort=name:-1
  /rest/blogpost?sort=title:-1,date:1&filter[name]=C
  /rest/blogpost?sort=title:-1,date:1&filter[title]=C&transform=labelval
  /rest/blogpost/:id/comments/1
  /rest/blogpost/:id/comments/1?transform=labelval
  /rest/blogpost/:id/comments/1?transform=labelval&single=false
  /rest/blogpost/:id/comments/1?transform=labelval&single=true
  /rest/blogpost/finder/findTitleLike?title=c
  /rest/blogpost/finder/findTitleLike?title=Post&filter[title]=C
  /rest/blogpost/finder/findTitleLike/Post?filter[title]=C
  */
  app.get("/login", function (req, res, next) {
     var _x = res.locals.expose
      , _rou = _x.route.split("/").slice(1)
      , _len = _rou.length
      , _mod = self.model("user")
      , _dsp
    ;//=======================================
    $u.each(_mod.schema.tree, function(v,k,l){
       (v.perm && parseInt(String(v.perm)[_x.ud||0],10) === 1) && (_dsp[k]=v)
    }, _dsp={});
    res.send(_dsp)
  });

  app.get("/register", function (req, res, next) {
     var _x = res.locals.expose
      , _rou = _x.route.split("/").slice(1)
      , _len = _rou.length
      , _mod = self.model("user")
      , _dsp
    ;//=======================================
    $u.each(_mod.schema.tree, function(v,k,l){
       (v.perm && parseInt(String(v.perm)[_x.ud||0],10) <= 2) && (_dsp[k]=v)
    }, _dsp={});
    res.send(_dsp)
  });

  app.get(RegExp(_nested[0] + _nested[4], "i"), function (req, res, next) {
    var _x = res.locals.expose
      , _rou = _x.route.split("/").slice(1)
      , _len = _rou.length
      , _mod = self.model(_rou[0])
      , _dsp
    ;//===================================

    _x.def.header.push({t:"navbar0", o:{"menu": { "home": { "name": "Home" }, "user": { "name": "User", "node": "Register" }, "reports": { "name": "Reports", "node": "Overview"}}}});
    _x.def.header.push({t:"breadcrumb", o:{}});


    self.log.info("pathing in odm", req.params[0], _len, _x);
    //console.log(_mod.schema.virtuals);
    //console.log(Object.keys(_mod.schema.virtuals).join(" "));
    $u.each(_mod.schema.tree, function(v,k,l){ (v.perm && parseInt(String(v.perm)[_x.ud||0],10) >= 1) && (_dsp+=" "+k) }, _dsp="");
    _dsp = $u.trim(_dsp);
    console.error("[31m%s [0m: [31m[1m%s [0m", "ERR", _dsp);
    if(_dsp === "")
      return res.send("Dont have Permission");

    if(_len === 1){
      _dsp = "_id " + _dsp;
      console.log(_dsp)
      _x.tmpl = {t:"table",o:{colm:_dsp}};
      return _mod.count({}, self.find(_mod, _mod.find({}).select(_dsp), req, res, next));
    }

    var _sng = req.query.single || true, _fnd, _cbs, _pop, _qry;
    if(_len > 2 && _rou[1] === _search){
      _qry = [req.query];
      _len > 3 && (_qry = _qry.concat($u.split(req.params[4])))
      _fnd = _mod[_rou[3]].apply(_mod, _qry).select($u.trim(_dsp));
      return _fnd.count(self.find(_mod, _fnd, req, res, next));
    }

    _fnd = _mod.findOne(qry.oid(_rou[1])).select($u.trim(_dsp));
    qry.populate(_fnd, req.query);
    _len > 2 && (_pop =_rou[2]);

    _x.tmpl = {t:"section",o:{colm:_dsp}};
    if (_pop) {
      qry.populate(_fnd, { populate: [_pop]});
      _cbs = new streams.CallbackStream();
      self.transit(self.createStream(_cbs, req, res, next), req.query, _mod).pipe(self.responseStream(null, _sng)).pipe(res);
      _fnd.exec(function (err, doc) { return err ? _cbs.emit("error", err) : $u.invoke(doc, _pop, _cbs.procedure()); });
    } else {

      //return self.transit(self.createStream(_fnd, req, res, next), req.query, _mod).pipe(self.responseStream(null, _sng)).pipe(res);
      return self.transit(self.createStream(_fnd, req, res, next), req.query, _mod).pipe(self.renderStream(null, _sng, res)).pipe(res);
    }

  });

  app.post(RegExp(_nested[0]), function (req, res, next) {
    var _mod = self.model(req.params[0]);
    if(!_mod || req.body === void 0 || Object.keys(req.body).length<1)
      return self.error("ERR", req, res, next);
    new _mod(qry.clean(req.body)).save(self.run(res));
  });

  app.put(RegExp(_nested[0] + "\\/(?:([^\\/]+?))"), function (req, res, next) {
    var _mod = self.model(req.params[0]);
    _mod.findOne(qry.oid(req.params[1]), function (err, doc) {
      if (err) return next(err);
      $u.extend(doc, qry.clean(req.body));
      doc.save(function (err, ret) {
        if (err) return next(err);
        var doc = ret.toJSON();
        res.send({ status: 0, payload: doc });
      });
    });
  });

  app.del(RegExp(_nested[0] + "\\/(?:([^\\/]+?))"), function (req, res, next) {
    var _mod = self.model(req.params[0])
      , _snd = function (err, o) { if (err) return next(err); res.send({ status: 0, payload: null }); };
    _mod.findOne(qry.oid(req.params[1]), function (err, doc) {
      if (err) return next(err);
      doc.remove(_snd);
    });
  });
};