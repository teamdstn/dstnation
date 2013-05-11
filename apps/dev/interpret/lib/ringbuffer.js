var Ringbuffer = (function() {
  function Ringbuffer(size) {
    this.size   = size;
    this.items  = [];
    this.count  = 0;
  }

  Ringbuffer.prototype.add = function(item) {
    var idx;
    idx = this.count % this.size;
    this.count++;
    item._timestamp = Number(new Date);
    this.items[idx] = item;
    return this.buildKey(idx, item);
  };

  Ringbuffer.prototype.all = function() {
    return this.items;
  };

  Ringbuffer.prototype.retrieve = function(key) {
    var idx, item, ts;
    if (!key.match(/^[0-9]+\-[0-9]+$/)) {
      return null;
    }
    idx = Number(key.match(/^[0-9]+/)[0]);
    tms = Number(key.match(/[0-9]+$/)[0]);
    if (idx !== void 0 && tms) {
      item = this.items[idx];
      if (item && item._timestamp === ts) {
        return item;
      } else {
        return null;
      }
    }
  };

  Ringbuffer.prototype.buildKey = function(idx, item) {
    return "" + idx + "-" + item._timestamp;
  };

  return Ringbuffer;

})();

exports.create = function(size) {
  return new Ringbuffer(size || 1000);
};
