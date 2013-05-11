var common = require("../common");

var Memory = exports.Memory = function(options) {
    options = options || {};
    this.type = "memory";
    this.store = {};
    this.mtimes = {};
    this.readOnly = false;
    this.loadFrom = options.loadFrom || null;
    if (this.loadFrom) {
        this.store = common.loadFilesSync(this.loadFrom);
    }
};

Memory.prototype.get = function(key) {
    var target = this.store, path = common.path(key);
    while (path.length > 0) {
        key = path.shift();
        if (!(target && key in target)) {
            return;
        }
        target = target[key];
        if (path.length === 0) {
            return target;
        }
    }
};

Memory.prototype.set = function(key, value) {
    if (this.readOnly) {
        return false;
    }
    var target = this.store, path = common.path(key);
    this.mtimes[key] = Date.now();
    while (path.length > 1) {
        key = path.shift();
        if (!target[key] || typeof target[key] !== "object") {
            target[key] = {};
        }
        target = target[key];
    }
    key = path.shift();
    target[key] = value;
    return true;
};

Memory.prototype.clear = function(key) {
    if (this.readOnly) {
        return false;
    }
    var target = this.store, path = common.path(key);
    delete this.mtimes[key];
    while (path.length > 1) {
        key = path.shift();
        if (!target[key]) {
            return;
        }
        target = target[key];
    }
    key = path.shift();
    delete target[key];
    return true;
};

Memory.prototype.merge = function(key, value) {
    if (this.readOnly) {
        return false;
    }
    if (typeof value !== "object" || Array.isArray(value)) {
        return this.set(key, value);
    }
    var self = this, target = this.store, path = common.path(key), fullKey = key;
    this.mtimes[key] = Date.now();
    while (path.length > 1) {
        key = path.shift();
        if (!target[key]) {
            target[key] = {};
        }
        target = target[key];
    }
    key = path.shift();
    if (typeof target[key] !== "object" || Array.isArray(target[key])) {
        target[key] = value;
        return true;
    }
    return Object.keys(value).every(function(nested) {
        return self.merge(common.key(fullKey, nested), value[nested]);
    });
};

Memory.prototype.reset = function() {
    if (this.readOnly) {
        return false;
    }
    this.mtimes = {};
    this.store = {};
    return true;
};

Memory.prototype.loadSync = function() {
    return this.store || {};
};