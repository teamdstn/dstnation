var Model = require("mongoose").Model,
  utils = require("../utils");

module.exports = exports = ttl;

function ttl(schema, options) {
  options || (options = {});
  var key = "__ttl",
    overridden = "__ttlOverride",
    ttl = options.ttl || 6e4,
    interval = options.interval || 6e4 * 5,
    reap = false !== options.reap,
    onReap = "function" == typeof options.onReap ? options.onReap : undefined;
  var o = {};
  o[key] = Date;
  schema.add(o);
  schema.index(key, {
    background: true
  });
  schema.pre("save", function (next) {
    if (overridden in this) {} else {
      this[key] = fromNow();
    }
    next();
  });
  schema.statics.startTTLReaper = function startTTLReaper() {
    if (key in this) return;
    var self = this;
    self[key] = setInterval(function remove() {
      self.remove().where(key).lte(new Date()).exec(onReap);
      return remove;
    }(), interval);
  };
  schema.statics.stopTTLReaper = function stopTTLReapter() {
    clearInterval(this[key]);
    delete this[key];
  };
  schema.on("init", init);

  function init(model) {
    if (model.__ttl) return;
    var distinct_ = model.distinct;
    model.distinct = function distinct(field, cond, cb) {
      applyTTL(cond);
      return distinct_.call(model, field, cond, cb);
    };
    "findOne find count".split(" ").forEach(function (method) {
      var fn = model[method];
      model[method] = function (cond, fields, opts, cb) {
        if (!cond) {
          cond = {};
        } else if ("function" == typeof cond) {
          cb = cond;
          cond = {};
        }
        applyTTL(cond);
        return fn.call(model, cond, fields, opts, cb);
      };
    });
    "where $where".split(" ").forEach(function (method) {
      var fn = model[method];
      model[method] = function () {
        var query = fn.apply(this, arguments),
          cond = {};
        applyTTL(cond);
        return query.find(cond);
      };
    });
    if (reap) {
      model.startTTLReaper();
    }
  }
  var virt = schema.virtual("ttl");
  virt.get(function () {
    if (this[key]) return this[key];
    this.ttl = ttl;
    return this.ttl;
  });
  virt.set(function (val) {
    if ("reset" == val) return this.resetTTL();
    this[overridden] = arguments.length ? val : ttl;
    return this[key] = fromNow(this[overridden]);
  });
  schema.methods.resetTTL = function resetTTL() {
    delete this._doc[key];
    delete this[overridden];
  };

  function fromNow(val) {
    var v = arguments.length ? val : ttl;
    return new Date(Date.now() + utils.ms(v));
  }

  function applyTTL(cond) {
    if (cond[key]) {
      cond.$and || (cond.$and = []);
      var a = {};
      a[key] = cond[key];
      cond.$and.push(a);
      var b = {};
      b[key] = {
        $gt: new Date()
      };
      cond.$and.push(b);
      delete cond[key];
    } else {
      cond[key] = {
        $gt: new Date()
      };
    }
  }
}
