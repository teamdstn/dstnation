var common  = require('./common')
  , async   = common.async
;//=======================================

var Provider = exports.Provider = function (options) {
    options = options || {};
    this.stores   = {};
    this.sources  = [];
    this.init(options);
};

["argv", "env"].forEach(function (type) {
  Provider.prototype[type] = function (options) {
    return this.add(type, options);
  };
});

Provider.prototype.file = function (key, options) {
  if (arguments.length == 1) {
    options = typeof key === "string" ? { file: key } : key;
    key = "file";
  } else {
    options = typeof options === "string" ? { file: options} : options;
  }
  options.type = "file";
  return this.add(key, options);
};

["defaults", "overrides"].forEach(function (type) {
  Provider.prototype[type] = function (options) {
    options = options || {};
    if (!options.type) {
      options.type = "literal";
    }
    return this.add(type, options);
  };
});

Provider.prototype.use = function (name, options) {
  options = options || {};
  var type = options.type || name;

  function sameOptions(store) {
    return Object.keys(options).every(function (key) {
      return options[key] === store[key];
    });
  }
  var store = this.stores[name],
    update = store && !sameOptions(store);
  if (!store || update) {
    if (update) {
      this.remove(name);
    }
    this.add(name, options);
  }
  return this;
};

Provider.prototype.add = function (name, options) {
  options = options || {};
  var type = options.type || name;
  if (!require("../conf")[common.capitalize(type)]) {
    throw new Error("Cannot add store with unknown type: " + type);
  }
  this.stores[name] = this.create(type, options);
  if (this.stores[name].loadSync) {
    this.stores[name].loadSync();
  }
  return this;
};

Provider.prototype.remove = function (name) {
  delete this.stores[name];
  return this;
};

Provider.prototype.create = function (type, options) {
  return new(require('../conf')[common.capitalize(type.toLowerCase())])(options);
};

Provider.prototype.init = function (options) {
  var self = this;
  if (options.type) {
    this.add(options.type, options);
  } else if (options.store) {
    this.add(options.store.name || options.store.type, options.store);
  } else if (options.stores) {
    Object.keys(options.stores).forEach(function (name) {
      var store = options.stores[name];
      self.add(store.name || name || store.type, store);
    });
  }

  if (options.source) {
    this.sources.push(this.create(options.source.type || options.source.name, options.source));
  } else if (options.sources) {
    Object.keys(options.sources).forEach(function (name) {
      var source = options.sources[name];
      self.sources.push(self.create(source.type || source.name || name, source));
    });
  }
};

Provider.prototype.get = function (key, cb) {
  if (!cb) return this._execute("get", 1, key, cb);
  var current = 0
    , names = Object.keys(this.stores)
    , self = this
    , response
    , mergeObjs = []
  ;//=====================================================
  async.whilst(function () { return response === void 0 && current < names.length; }, function (next) {
    var store = self.stores[names[current]];
    current++;

    console.log(key);
    if (store.get.length >= 2) {
      return store.get(key, function (err, value) {
        if (err) return next(err);
        response = value;

        if (typeof response === "object" && !Array.isArray(response)) {
          mergeObjs.push(response);
          response = undefined;
        }
        next();
      });
    };

    response = store.get(key);


    if (typeof response === "object" && !Array.isArray(response)) {
      mergeObjs.push(response);
      response = undefined;
    };

    next();

  }, function (err) {
    if (!err && mergeObjs.length) {
      response = common.merge(mergeObjs.reverse());
    }
    return err ? cb(err) : cb(null, response);
  });
};

Provider.prototype.set    = function (key, val, cb) { return this._execute("set", 2, key, val, cb); };
Provider.prototype.clear  = function (key, cb) { return this._execute("clear", 1, key, cb); };
Provider.prototype.reset  = function (cb) { return this._execute("reset", 0, cb); };


Provider.prototype.merge = function () {
  var self = this,
    args = Array.prototype.slice.call(arguments),
    cb = typeof args[args.length - 1] === "function" && args.pop(),
    value = args.pop(),
    key = args.pop();

  function mergeProperty(prop, next) {
    return self._execute("merge", 2, prop, value[prop], next);
  }
  if (!key) {
    if (Array.isArray(value) || typeof value !== "object") {
      return onError(new Error("Cannot merge non-Object into top-level."), cb);
    }
    return async.forEach(Object.keys(value), mergeProperty, cb || function () {});
  }
  return this._execute("merge", 2, key, value, cb);
};

Provider.prototype.load = function (cb) {
  var self = this;

  function getStores() {
    var stores = Object.keys(self.stores);
    stores.reverse();
    return stores.map(function (name) {
      return self.stores[name];
    });
  }

  function loadStoreSync(store) {
    if (!store.loadSync) {
      throw new Error("nconf store " + store.type + " has no loadSync() method");
    }
    return store.loadSync();
  }

  function loadStore(store, next) {
    if (!store.load && !store.loadSync) {
      return next(new Error("nconf store " + store.type + " has no load() method"));
    }
    return store.loadSync ? next(null, store.loadSync()) : store.load(next);
  }

  function loadBatch(targets, done) {
    if (!done) {
      return common.merge(targets.map(loadStoreSync));
    }
    async.map(targets, loadStore, function (err, objs) {
      return err ? done(err) : done(null, common.merge(objs));
    });
  }

  function mergeSources(data) {
    if (data && typeof data === "object") {
      self.use("sources", {
        type: "literal",
        store: data
      });
    }
  }

  function loadSources() {
    var sourceHierarchy = self.sources.splice(0);
    sourceHierarchy.reverse();
    if (!cb) {
      mergeSources(loadBatch(sourceHierarchy));
      return loadBatch(getStores());
    }
    loadBatch(sourceHierarchy, function (err, data) {
      if (err) {
        return cb(err);
      }
      mergeSources(data);
      return loadBatch(getStores(), cb);
    });
  }
  return self.sources.length ? loadSources() : loadBatch(getStores(), cb);
};

Provider.prototype.save = function (value, cb) {
  !cb && typeof value === "function" && (cb = value, value = null);

  var self = this
    , names = Object.keys(this.stores)
  ;//============================================
  function saveStoreSync(memo, name) {
    var store = self.stores[name];
    if (store.saveSync) {
      var ret = store.saveSync();
      if (typeof ret == "object" && ret !== null) {
        memo.push(ret);
      }
    }
    return memo;
  }

  function saveStore(memo, name, next) {
    var store = self.stores[name];
    if (store.save) {
      return store.save(function (err, data) {
        if (err) {
          return next(err);
        }
        if (typeof data == "object" && data !== null) {
          memo.push(data);
        }
        next(null, memo);
      });
    } else if (store.saveSync) {
      memo.push(store.saveSync());
    }
    next(null, memo);
  }
  if (!cb) {
    return common.merge(names.reduce(saveStoreSync, []));
  }
  async.reduce(names, [], saveStore, function (err, objs) {
    return err ? cb(err) : cb(null, common.merge(objs));
  });
};

Provider.prototype._execute = function (action, syncLength) {

  var args = Array.prototype.slice.call(arguments, 2)
    , cb = typeof args[args.length - 1] === "function" && args.pop()
    , destructive = ["set", "clear", "merge", "reset"].indexOf(action) !== -1
    , mergeObjs = []
    , self = this
    , response
  ;//==========================================

  function runAction(name, next) {
    var store = self.stores[name];
    if (destructive && store.readOnly) return next();
    return store[action].length > syncLength ? store[action].apply(store, args.concat(next)) : next(null, store[action].apply(store, args));
  }
  if (cb) {
    return async.forEach(Object.keys(this.stores), runAction, function (err) {
      return err ? cb(err) : cb();
    });
  }
  Object.keys(this.stores).forEach(function (name) {


    if (typeof response === "undefined") {
      var store = self.stores[name];
      if (destructive && store.readOnly) {
        return;
      }
      response = store[action].apply(store, args);
      if (action === "get" && typeof response === "object" && !Array.isArray(response)) {
        mergeObjs.push(response);
        response = undefined;
      }
    }
  });
  if (mergeObjs.length) {
    response = common.merge(mergeObjs.reverse());
  }

  return response;
};

function onError(err, cb) {
  if (cb) return cb(err);
  throw err;
}
