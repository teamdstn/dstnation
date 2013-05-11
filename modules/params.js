var util = require("util");

function Params(hash) {
    this.hash = hash;
    this.allowed = [];
}

Params.prototype.parse = function(args) {
    args = slice(args);
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
};

Params.prototype.only = function(args) {
    var allowed = this.parse(arguments), obj = {};
    allowed.forEach(function(key) {
        obj[key] = this.hash[key];
    }, this);
    return obj;
};

Params.prototype.except = function(args) {
    var filtered = this.parse(arguments), obj = {};
    Object.keys(this.hash).forEach(function(key) {
        if (~filtered.indexOf(key)) return;
        obj[key] = this.hash[key];
    }, this);
    return obj;
};

Params.prototype.require = function(args) {
    var required = this.parse(arguments), obj = {};
    required.forEach(function(key) {
        if (key in this.hash) return;
        throw new Error('Missing key "' + key + '" for ' + util.inspect(this.hash));
    }, this);
    return this.hash;
};

Params.prototype.permit = function(key) {
    this.allowed.push(key);
    return this;
};

Params.prototype.slice = function() {
    Object.keys(this.hash).forEach(function(key) {
        if (!~this.allowed.indexOf(key)) {
            delete this.hash[key];
        }
    }, this);
};

function slice(args) {
    return Array.prototype.slice.call(args);
}

module.exports = function(hash) {
    return new Params(hash);
};

module.exports.Params = Params;

/*
params({ foo: 1, bar: 2, baz: 3 }).only('foo', 'baz');
params({ foo: 1, bar: 2, baz: 3 }).only(['foo', 'baz']);

params({ foo: 1, bar: 2, baz: 3 }).except('foo', 'baz');
params({ foo: 1, bar: 2, baz: 3 }).except(['foo', 'baz']);

params({ foo: 1, bar: 2, baz: 3 }).require('missing', 'key');
params({ foo: 1, bar: 2, baz: 3 }).require(['missing', 'key']);

var hash = { foo: 1, bar: 2, baz: 3 };

params(hash)
  .permit('foo')
  .permit('baz')
  .slice()

console.log(hash);
*/