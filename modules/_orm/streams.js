var Stream  = require("stream").Stream;
var $u      = require("./util");

/* ArrayFormatter
━━━━━━━━━━━━━━━━━━━━━━━━*/
function ArrayFormatter() {
  Stream.call(this);
  this.writable = true, this.meta  = {}, this._done = false;
}

ArrayFormatter.prototype.__proto__ = Stream.prototype;
ArrayFormatter.prototype.write = function (doc) {
  if (!this._hasWritten) {
    this._hasWritten = true;
    this.emit("data", '{ "results": [' + JSON.stringify(doc));
  } else {
    this.emit("data", "," + JSON.stringify(doc));
  }
  return true;
};
ArrayFormatter.prototype.end = ArrayFormatter.prototype.destroy = function () {
  if (this._done) return;
  this._done = true;
  var str = "]";
  if (this.total) str += ',"total":' + this.total;
  if (this.totalFiltered) str += ',"totalFiltered":' + this.totalFiltered;
  str += "}";
  this.emit("data", str);
  this.emit("end");
};

/* TransStream
━━━━━━━━━━━━━━━━━━━━━━━━*/
function TransStream(trans) {
  Stream.call(this);
  this.writable = true, this.trans = trans || [], this._done = false;
}
TransStream.prototype.__proto__ = Stream.prototype;
TransStream.prototype.write = function (doc) {
  var result = doc;
  this.trans.some(function (v, k) {
    result = v.call(null, result);
    return result == null;
  });
  if (result != null) this.emit("data", result);
  return true;
};
TransStream.prototype.end = TransStream.prototype.destroy = function () {
  if (this._done) return;
  this._done = true;
  this.emit("end");
};

/* JStream
━━━━━━━━━━━━━━━━━━━━━━━━*/
function JStream(meta, single) {
  Stream.call(this);
  this.response = $u.extend({ payload: [], status: 0}, meta);
  this.writable = true, this._single = single || [], this._done = false;
}
JStream.prototype.__proto__ = Stream.prototype;
JStream.prototype.procedure = function (tostream) {
  return function (err, obj) {
    if (err) {
      this.response.error = err;
      this.status = 1;
    } else this.response.payload = obj;
    this.pipe(tostream);
    tostream.contentType("json");
    this.end();
  }.bind(this);
};
JStream.prototype.write = function (doc) {
  this.response.payload.push(doc);
  return true;
};
JStream.prototype.format = function (data) {
  return JSON.stringify(this.response);
};
JStream.prototype.end = JStream.prototype.destroy = function () {
  if (this._done) return;
  this._done = true;
  var payload = this.response.payload;
  if (payload) {
    var isArray = Array.isArray(payload);
    if (this._single == true || this._single == "true") {
      if (isArray) {
        this.response.payload = payload.length ? payload[0] : null;
      }
    }
  }
  this.emit("data", this.format(this.response));
  this.emit("end");
};

/* CallbackStream
━━━━━━━━━━━━━━━━━━━━━━━━*/
function CallbackStream() {
  Stream.call(this);
  this.writable = true, this._done = false;
}
CallbackStream.prototype.__proto__ = Stream.prototype;
CallbackStream.prototype.write = function (doc) {
  this.emit("data", doc);
  return true;
};
CallbackStream.prototype.stream = function () {
  return this;
};
CallbackStream.prototype.procedure = function () {
  return function (err, obj) {
    if (err) {
      this.emit("error", err);
    } else {
      if (Array.isArray(obj)) obj.forEach(this.write, this);
      else this.write(obj);
    }
    this.end();
  }.bind(this);
};
CallbackStream.prototype.end = CallbackStream.prototype.destroy = function () {
  if (this._done) return;
  this._done = true;
  this.emit("end");
};
function transit() {
  return new Transit();
};

function Transit() {};

Transit.prototype.pump = function (strm, mod, label) {
  if (!strm) throw new Error("Must have a stream to pump from");
  var to = this.createStream(mod, label);
  var ret = to ? strm.pipe(to) : strm;
  return ret;
};
Transit.prototype.createStream = function (mod, label) {
  if (!label) return null;
  var trans = $u.splits(label).map(function (v, k) {
    if (this.trans[v]) {
      return this.trans[v](mod, v);
    } else {
      console.warn("no transformer for [" + v + "]");
    }
  }, this).filter(_null);
  if (trans.length) return new TransStream(trans);
};

Transit.prototype.trans = {
  labelval: function (mod) {
    var labelAttr = createLabel(mod);
    this.only = ["_id"];

    if (labelAttr) {
      this.only.push(labelAttr);
      return function (obj) {
        return { val: obj._id, label: obj[labelAttr] };
      };
    }
    var modelName = mod.modelName;
    return function (obj) {
      return { val: obj._id, label: modelName + " [" + obj._id + "]" };
    };
  }
};

function _null(v, k) { return v != null;}
function createLabel(mod) {
  var label = $u.getsafe(mod, "options.display.labelAttr");
  if (label) return label;
  mod.schema.eachPath(function (v, k) {
    if (v != "_id" && (v.toLowerCase() == "name" || v.toLowerCase() == "title")) {
      label = v;
      return true;
    }
  });
  if (label) $u.setunless(mod, "options.display.labelAttr", label);
  return label;
}

module.exports.ArrayFormatter     = ArrayFormatter;
module.exports.transit            = transit;
module.exports.TransStream        = TransStream;
module.exports.JStream            = JStream;
module.exports.CallbackStream     = CallbackStream;

module.exports.run = function (meta, tostream) {
  if (!tostream) { tostream = meta; meta = {}; }
  return new JStream(meta).procedure(tostream);
};