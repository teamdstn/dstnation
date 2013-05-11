//[] :___________________________
var redis = require('redis')
  , async = require('../../async')
  , conf  = require('../../conf')
;//_______________________________

var Redis = exports.Redis = function (options) {
  options        = options || {};
  this.type      = 'redis';
  this.namespace = options.namespace || 'conf';
  this.host      = options.host || 'localhost';
  this.port      = options.port || 6379;
  this.db        = options.db   || 0;
  this.ttl       = options.ttl  || 60 * 60 * 1000;
  this.cache     = new conf.Memory();
  this.redis     = redis.createClient(options.port, options.host);
  this.redis.select(this.db);
  if (options.auth) {
    this.redis.auth(options.auth);
  }
  this.redis.on('error', function (err) {
    console.dir(err);
  });
};

conf.Redis = Redis;

Redis.prototype.get = function (key, callback) {
  var self    = this,
      result  = {},
      now     = Date.now(),
      mtime   = this.cache.mtimes[key],
      fullKey = conf.key(this.namespace, key);
  callback = callback || function () { };
  if (mtime && now - mtime < this.ttl) {
    return callback(null, this.cache.get(key));
  }
  this.redis.smembers(conf.key(fullKey, 'keys'), function (err, keys) {
    function addValue (source, next) {
      self.get(conf.key(key, source), function (err, value) {
        if (err) {
          return next(err);
        }
        result[source] = value;
        next();
      });
    }
    if (keys && keys.length > 0) {
      async.forEach(keys, addValue, function (err) {
        if (err) {
          return callback(err);
        }
        self.cache.set(key, result);
        callback(null, result);
      })
    }
    else {
      self.redis.get(fullKey, function (err, value) {
        if (err) {
          return callback(err);
        }
        result = JSON.parse(value);
        if (result) {
          self.cache.set(key, result);
        }
        callback(null, result);
      });
    }
  });
};
Redis.prototype.set = function (key, value, callback) {
  var self = this,
      path = conf.path(key);
  callback = callback || function () { };
  this._addKeys(key, function (err) {
    if (err) {
      return callback(err);
    }
    var fullKey = conf.key(self.namespace, key);
    if (!Array.isArray(value) && value !== null && typeof value === 'object') {
      self.cache.set(key, value);
      self._setObject(fullKey, value, callback);
    }
    else {
      self.cache.set(key, value);
      value = JSON.stringify(value);
      self.redis.set(fullKey, value, callback);
    }
  });
};
Redis.prototype.merge = function (key, value, callback) {
  if (typeof value !== 'object' || Array.isArray(value)) {
    return this.set(key, value, callback);
  }
  var self    = this,
      path    = conf.path(key),
      fullKey = conf.key(this.namespace, key);
  callback = callback || function () { };
  this._addKeys(key, function (err) {
    self.redis.smembers(conf.key(fullKey, 'keys'), function (err, keys) {
      function nextMerge (nested, next) {
        var keyPath = conf.key.apply(null, path.concat([nested]));
        self.merge(keyPath, value[nested], next);
      }
      if (keys && keys.length > 0) {
        return async.forEach(Object.keys(value), nextMerge, callback);
      }
      self.set(key, value, callback);
    });
  });
};
Redis.prototype.clear = function (key, callback) {

  var self    = this,
      result  = {},
      path    = [this.namespace].concat(conf.path(key)),
      last    = path.pop(),
      fullKey = conf.key(this.namespace, key);
  callback = callback || function () { };

  this.cache.clear(key);
  this.redis.srem(conf.key.apply(null, path.concat(['keys'])), last, function (err) {
    self.redis.smembers(conf.key(fullKey, 'keys'), function (err, keys) {
      function removeValue (child, next) {
        self.clear(conf.key(key, child), next);
      }
      if (keys && keys.length > 0) {
        async.forEach(keys, removeValue, callback);
      }
      else {
        self.redis.del(fullKey, callback);
      }
    });
  });
};

Redis.prototype.save = function (value, callback) {
  if (Array.isArray(value) || typeof value !== 'object') {
    return callback(new Error('`value` to be saved must be an object.'));
  }
  var self = this,
      keys = Object.keys(value);
  callback = callback || function () { };
  this.reset(function (err) {
    if (err) {
      return callback(err);
    }
    async.forEach(keys, function (key, next) {
      self.set(key, value[key], next);
    }, callback);
  });
};

Redis.prototype.load = function (callback) {
  var self   = this,
      result = {};
  callback = callback || function () { };
  this.redis.smembers(conf.key(this.namespace, 'keys'), function (err, keys) {
    if (err) {
      return callback(err);
    }
    function addValue (key, next) {
      self.get(key, function (err, value) {
        if (err) {
          return next(err);
        }
        result[key] = value;
        next();
      });
    }
    keys = keys || [];
    async.forEach(keys, addValue, function (err) {
      return err ? callback(err) : callback(null, result);
    });
  });
};

Redis.prototype.reset = function (callback) {
  var self = this;
  callback = callback || function () { };
  this.redis.smembers(conf.key(this.namespace, 'keys'), function (err, existing) {
    if (err) {
      return callback(err);
    }
    existing = existing || [];
    async.forEach(existing, function (key, next) {
      self.clear(key, next);
    }, callback);
  });
};

Redis.prototype._addKeys = function (key, callback) {
  var self = this,
      path = conf.path(key);
  function addKey (partial, next) {
    var index  = path.indexOf(partial),
        base   = [self.namespace].concat(path.slice(0, index)),
        parent = conf.key.apply(null, base.concat(['keys']));
    self.redis.sadd(parent, partial, next);
  };
  async.forEach(path, addKey, callback);
};

Redis.prototype._setObject = function (key, value, callback) {
  var self = this,
      keys = Object.keys(value);
  function addValue (child, next) {
    self.redis.sadd(conf.key(key, 'keys'), child, function (err) {
      if (err) {
        return next(err);
      }
      var fullKey = conf.key(key, child),
          childValue = value[child];
      if (!Array.isArray(childValue) && typeof childValue === 'object') {
        self._setObject(fullKey, childValue, next);
      }
      else {
        childValue = JSON.stringify(childValue);
        self.redis.set(fullKey, childValue, next);
      }
    });
  }
  async.forEach(keys, addValue, function (err) {
    return err ? callback(err) : callback();
  });
};