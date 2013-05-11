//[DEPENDENCE] :_________________________________
var EventEmitter = require("events").EventEmitter
;//_______________________________________________
//[EXPORTS] :_____________________________________
exports = module.exports  = BufferList;
BufferList.BufferList     = BufferList;
;//_______________________________________________
//[UTILITY] :_____________________________________
var __self    = function(o){ return o instanceof $Class; }
var inherits  = function(ctor,stor){ctor.super_ = stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}
;//_______________________________________________

function BufferList(options) {
    options = options || {};
    if(!__self(this)) return new BufferList(options);
    EventEmitter.call(this);

    var self = this;
    self.encoding   = options.encoding;
    self.construct  = options.construct || Buffer;

    //[] :_____________________________
    var head    = { next: null, buffer: null }
      , last    = { next: null, buffer: null }
      , length  = 0
      , offset  = 0
    ;//_________________________________

    self.__defineGetter__("length", function() {
        return length;
    });

    self.write = function(buf) {
        if (!head.buffer) {
            head.buffer = buf;
            last = head;
        } else {
            last.next = {
                next: null,
                buffer: buf
            };
            last = last.next;
        }
        length += buf.length;
        self.emit("write", buf);
        return true;
    };

    self.end = function(buf) {
      __self(buf) && (self.write(buf))
    };

    self.push = function() {
        var args = [].concat.apply([], arguments);
        args.forEach(self.write);
        return self;
    };

    self.forEach = function(fn) {
        if (!head.buffer) return new self.construct(0);
        if (head.buffer.length - offset <= 0) return self;
        var firstBuf = new self.construct(head.buffer.length - offset);
        head.buffer.copy(firstBuf, 0, offset, head.buffer.length);
        var b = {
            buffer: firstBuf,
            next: head.next
        };
        while (b && b.buffer) {
            var r = fn(b.buffer);
            if (r) break;
            b = b.next;
        }
        return self;
    };

    self.join = function(start, end) {
        if (!head.buffer) return new self.construct(0);
        if (start == undefined) start = 0;
        if (end == undefined) end = self.length;
        var big = new self.construct(end - start);
        var ix = 0;
        self.forEach(function(buffer) {
            if (start < ix + buffer.length && ix < end) {
                buffer.copy(big, Math.max(0, ix - start), Math.max(0, start - ix), Math.min(buffer.length, end - ix));
            }
            ix += buffer.length;
            if (ix > end) return true;
        });
        return big;
    };

    self.advance = function(n) {
        offset += n;
        length -= n;
        while (head.buffer && offset >= head.buffer.length) {
            offset -= head.buffer.length;
            head = head.next ? head.next : {
                buffer: null,
                next: null
            };
        }
        self.emit("advance", n);
        return self;
    };

    self.take = function(n, encoding) {
        if (n == undefined) n = self.length; else if (typeof n !== "number") {
            encoding = n;
            n = self.length;
        }
        var b = head;
        if (!encoding) encoding = self.encoding;
        if (encoding) {
            var acc = "";
            self.forEach(function(buffer) {
                if (n <= 0) return true;
                acc += buffer.toString(encoding, 0, Math.min(n, buffer.length));
                n -= buffer.length;
            });
            return acc;
        } else {
            return self.join(0, n);
        }
    };

    self.toString = function() {
        return self.take("binary");
    };
}
inherits(BufferList, EventEmitter);

