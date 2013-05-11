ovar EventEmitter = require("events").EventEmitter
  , fs        = require("fs")
  , pt        = require("path")
  , mongoose  = require("mongoose")
  , streams   = require("./_orm/streams")
  , qry       = require("./_orm/query")
  , $u        = require("./_orm/util")
;//===================================
exports = module.exports = create;

function err(err, req, res, next) {
  res.send({
    status: 1,
    error: err && err.message
  });
};

function create(nm, options) {
  options = options || {};

  function ins(route) {
    if (!ins.conn) throw new Error("mongoose is required");
    return {
      __mounted: function(app) {
        ins.route(this.route, app);
      },
      handle: function (req, res, next) {
        res.contentType("json");
        next();
      },
      set: function (nested, path) {
        self[nested] = path;
      },
      emit: function (evt, app) {
        if (evt === "mount") {
          this.__mounted(app);
        }
      }
    };
  };

  $u.extend(ins, proto);
  $u.extend(ins, EventEmitter.prototype);
  ins.conn = mongoose.createConnection();
  //ins.conn.open("mongodb://localhost/" + nm);
  ins.trans  = options.trans  || streams.transit();
  ins.stream = options.stream || streams.JStream;
  ins.error  = options.error  || err;
  return ins;
}

/*
var customSet       = function (value) { return value;};
var customGet       = function (value) { return value;};
var customValidator = function () {return true;};
var defaultString   = function () { return 'default';};


gen.setSetter('customSet', customSet);
gen.setGetter('customGet', customGet);
gen.setValidator('customValidator', customValidator);
gen.setDefault('defaultString',  defaultString);
gen.setDefault('defaultDate',    defaultString);
gen.setDefault('defaultBuffer',  defaultString);
gen.setDefault('defaultBoolean', defaultString);
gen.setDefault('defaultNumber',  defaultString);


gen.setConnection(mongoose.connection);
if(err) return console.error("E", err);
$u.readJSON(options.models, true, function(err, doc){
if(err) {console.error(err);
}
else{
var nm = $u.stripExt(doc.name);
var mod = gen.schema(nm, doc.data);
var omod = ins.conn.model(mod.modelName);

omod.create({name:"dultoman"}, function(err){
  console.log("err", err);
})
}
});
*/


var proto = {};

proto.transit = function(strm, query, m) {
  return this.trans.pump(strm, m, query.trans);
}

proto.responseStream = function(strm, query, m) {
  return new this.stream || streams.JStream;
}

proto.model = function(m) {
  var _conn = this.conn;
  return qry.model(_conn, m.param && m.param("type") || m);
}

proto.run = function(meta, tostream) {
  if (!tostream) { tostream = meta; meta = {}; }
  return this.responseStream(meta).procedure(tostream);
}

proto.find = function(m, fnd, req, res, next) {
  //res.contentType("json");
  var self = this;
  var _single = req.query.single;
  return function (err, cnt) {
    if (err) return next(err);

    qry.populate(fnd, req.query);
    qry.paginate(fnd, req.query);
    qry.sort(fnd, req.query);

    var _stream = self.transit( self.createStream(fnd, req, res, next), req.query, m);
    if (req.query.filter && m) {
      qry.filter(fnd, req.query, m);
      fnd.count(function (err, fcnt) {
        if (err) return next(err);
        _stream.pipe(self.responseStream({total: cnt, filterTotal: fcnt}, _single)).pipe(res);
      });
    } else {
      _stream.pipe(self.responseStream({total: cnt}, _single)).pipe(res);
    }
  };
};
proto.createStream = function(query, req, res, next) {
  var self = this;
  var _stream = query.stream();
  _stream.on("error", function (err) {
    console.error("stream error [" + (err && err.message || "unknown") + "]");
    this.destroy();
    return self.err(err, req, res, next);
  });
  return _stream;
}
proto.route = function(nested, app) {
  /*
  var nested  = router.route;
  var app     = router.parent;
  */
  var self = this;
  var regx = {
    finds : RegExp("^\\" + nested + "\\/(?:([^\\/]+?))\\/finder/(?:([^\\/]+?))(?:\\/([\\w\\/]+?))?\\/?$", "i"),
    gets  : RegExp("^\\" + nested + "\\/(?:([^\\/]+?))\\/(?:([^\\/]+?))(?:\\/([\\w\\/]+?))?\\/?$")
  }

  /* GET
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.get(nested + "/:type", function (req, res, next) {
    //res.contentType("json");
    var _typ = req.param("type")
      , _mod = self.model(_typ)
    ;//----------------------------------
    _mod.count({}, self.find(_mod, _mod.find({}), req, res, next));
  });
  /* GET search
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.get(regx.finds, function (req, res, next) {
    //res.contentType("json");
    var _f = req.params[1], _mod, _arg, _fnd
    ;//----------------------------------
    req.params.type = req.params[0];
    _mod = self.model(req);
    _arg = [req.query];
    if (req.params.length > 2)
      _arg = _arg.concat($u.splits(req.params[2]));
    _fnd = _mod[_f].apply(_mod, _arg);
    _fnd.count(self.find(_mod, _fnd, req, res, next) );
  });
  /* GET
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.get(regx.gets, function (req, res, next) {
    //res.contentType("json");
    var _sng = req.query.single
      , _mod = self.model(req.params[0])
      , _fnd = _mod.findOne(qry.oid(req.params[1]))
      , _cbs
    ;//---------------------------------------------
    qry.populate(_fnd, req.query);
    var _pop = req.params.length > 1 ? req.params[2] : null;
    if (_pop) {
      qry.populate(_fnd, { populate: [_pop] });
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
  /* GET
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.get(nested + "/:type?", function (req, res, next) {
    console.error("no haddle", req.url);
    res.send({ status: 1, message: "No such url" });
  });
  /* POST
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.post(nested + "/:type", function (req, res, next) {
    var _mod = self.model(req);
    new _mod(qry.clean(req.body)).save(self.run(res));
  });
  /* PUT
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.put(nested + "/:type/:id", function (req, res, next) {
    var id = req.param("id");
    self.model(req).findOne(qry.oid(req), function (err, obj) {
      if (err) return next(err);
      $u.extend(obj, qry.clean(req.body));
      obj.save(function (err, ret) {
        if (err) return next(err);
        //res.contentType("json");
        var obj = ret.toJSON();
        res.send({ status: 0, payload: obj });
      });
    });
  });
  /* DEL
  ━━━━━━━━━━━━━━━━━━━━━━━━*/
  app.del(nested + "/:type/:id?", function (req, res, next) {
    var _mod = self.model(req)
      , _snd = function (err, o) {
        if (err) return next(err);
        res.send({ status: 0, payload: null });
      }
    ;//============================
    _mod.findOne(qry.oid(req), function (err, doc) {
      if (err) return next(err);
      doc.remove(_snd);
    });
  });
};






















/* trans ex
var funcs = [function (v, k) {
  return {
    name: "hello",
    _id: v._id
  };
}];
var _trans = new streams.TransStream(funcs);
_trans.trans.push(function (v) {
  return {
    name: v.name + " world",
    id: v._id
  };
});
_trans.trans.push(function (v) {
  !this._count && (this._count = 0);
  v.name = v.name + "(" + this._count + ")";
  this._count++;
  return this._count % 2 == 0 ? null : v;
});
_trans.trans.push(function (v) {
  return {
    name: v.name + " hidden",
    id: v.id
  };
});
var format = new streams.ArrayFormatter();
_mod.find().stream().pipe(_trans).pipe(format).pipe(res);
*/
