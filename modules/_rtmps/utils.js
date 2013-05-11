"use strict";

var assert = require('assert');

/* "BufferChain" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function dbg() {
  if(BufferChain.DBG) console.log.apply(console, arguments);
}

/** Work with data in multiple buffers, but don't copy.
 * - Same interface as Buffer
 * - Consume (i.e. read and throw away)
 * - Push buffer
 * - Slice
 */
var BufferChain = exports.BufferChain = function(buffer, ptr) {
    this.chain = [];
    this.ptr = +ptr || 0;
    this._length = 0;
    this.push(buffer);

    Object.seal(this);
  }

BufferChain.DBG = false;

BufferChain.prototype = {

  push: function(buffer) {
    if(buffer instanceof Buffer) {
      this.chain.push(buffer);
      this._length += buffer.length;
      return true;
    } else if(buffer instanceof BufferChain) {
      for(var i = 0; i < buffer.length; i++)
      this.push(buffer.chain[i]);
      return true;
    } else {
      return false;
    }
  },

  _index: function(ptr) {
    var index = 0;
    while(ptr >= this.chain[index].length)
    ptr -= this.chain[index++].length;
    return [index, ptr];
  },

  toString: function(encoding, start, end) {
    var subChain = this.slice(start, end);
    if(subChain.chain.length == 0) return '';

    if(subChain.chain.length == 1) return subChain.chain[0].toString(encoding);

    if(subChain.chain.length == 2) {
      // Either copy both chains or handle utf8 multibyte code points correctly
      // at the boundary between the first and the second buffer
      // I choose copying.
      var buffer = new Buffer(subChain.length);
      subChain.chain[0].copy(buffer);
      subChain.chain[1].copy(buffer, subChain.chain[0].length);
      return buffer.toString(encoding);
    }

    throw new Error('toString() over more than two buffers not implemented');
  },

  readDoubleBE: function(ptr) {
    var subChain = this.slice(ptr, ptr + 8);
    if(subChain.chain.length == 1) return subChain.chain[0].readDoubleBE(0);

    var buffer8 = new Buffer(8);
    for(var i = 0; i < 8; i++) buffer8[i] = subChain.readUInt8(i);
    return buffer8.readDoubleBE(0);
  },

  readUInt8: function(ptr) {
    var index = this._index(ptr);
    return this.chain[index[0]].readUInt8(index[1]);
  },

  consumeUInt8: function() {
    var value = this.chain[0][this.ptr];
    this.consume(1);
    return value;
  },

  readUInt32LE: function(ptr) {
    var index = this._index(ptr);
    return this.chain[index[0]].readUInt32LE(index[1]);

    // todo cross-buffer read, but don't worry node has an assert above
  },

  readUInt32BE: function(ptr) {
    var index = this._index(ptr);
    return this.chain[index[0]].readUInt32BE(index[1]);

    // todo cross-buffer read, but don't worry, node has an assert above
  },

  consumeInt32BE: function() {
    var b0 = this.consumeUInt8();
    var b1 = this.consumeUInt8();
    var b2 = this.consumeUInt8();
    var b3 = this.consumeUInt8();

    return b0 << 24 | b1 << 16 | b2 << 8 | b3;
  },

  consumeUInt24BE: function() {
    var b0 = this.consumeUInt8();
    var b1 = this.consumeUInt8();
    var b2 = this.consumeUInt8();

    return b0 << 16 | b1 << 8 | b2;
  },

  readUInt16BE: function(ptr) {
    var index = this._index(ptr);
    return this.chain[index[0]].readUInt16BE(index[1]);

    // todo cross-buffer read, but don't worry, node has an assert above
  },

  consumeUInt16BE: function() {
    var b0 = this.consumeUInt8();
    var b1 = this.consumeUInt8();

    return b0 << 8 | b1;
  },

  consumeBuffers: function(length) {
    var value = this.slice(this.ptr, this.ptr + length);
    this.consume(length);
    return value;
  },

  consume: function(length) {
    if(length > this.rest) throw new Error('length out of bounds ' + length + ' > ' + this.rest);

    var oldRest = this.rest;
    var oldPtr = this.ptr;
    var value1 = this.chain[0][oldPtr];
    if(value1 == null) {
      dbg('       consume() value1 undefined');
      value1 = 0;
    }

    this.ptr += length;
    var length0 = this.chain[0].length;
    while(this.ptr >= length0) {
      dbg('       consume() shifting buffer of length', length0, 'ptr', this.ptr, '->', this.ptr - length0);
      this.ptr -= length0;
      this._length -= length0;
      this.chain.shift();
    }

    dbg('       consume()', '0x' + value1.toString(16), length, 'rest', oldRest, '->', this.rest, 'ptr', oldPtr, '->', this.ptr);
  },

  // Todo TEST THIS CAREFULLY maybe the second loop does bufferLength wrong
  // if the next chain has differing length and other corner cases.
  slice: function(start, end) {
    if(start < 0 || start >= this._length) throw new Error('start out of bounds ' + start + ', 0 to ' + this.length + ' exclusive');
    if(end < 0 || end > this._length) throw new Error('end out of bounds ' + end + ', 0 to ' + this.length + ' inclusive');
    if(end < start) throw new Error('end ' + end + ' smaller than start ' + start);

    var bufferLength;

    // start position i0 (buffer array index) and j0 (index within buffer)
    var j0 = start;
    for(var i0 = 0; i0 < this.chain.length; i0++) {
      bufferLength = this.chain[i0].length;
      if(j0 < bufferLength) break; // exclusive
      j0 -= bufferLength;
    }

    // end position i1 and j1
    if(end == null) {
      i1 = this.chain.length - 1;
      j1 = this.chain[i1].length;
    } else {
      var j1 = j0 + end - start;
      for(var i1 = i0; i1 < this.chain.length; i1++) {
        bufferLength = this.chain[i1].length;
        if(j1 <= bufferLength) break; // inclusive
        j1 -= bufferLength;
      }
    }

    var j1IfSame = i0 == i1 ? j1 : undefined;
    var firstBuffer = this.chain[i0].slice(j0, j1IfSame);
    var chain = new BufferChain(firstBuffer);
    if(j1IfSame != null) return chain;

    for(var i = i0; i < i1 - 1; i++) chain.push(this.chain[i]);

    chain.push(this.chain[i + 1].slice(0, j1));
    return chain;
  },

}

Object.defineProperties(BufferChain.prototype, {
  length: {
    get: function() {
      return this._length;
    },
  },
  rest: {
    get: function() {
      return this._length - this.ptr;
    },
  },
});


/* "utils" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
"use strict";

require('colors');
var fs = require('fs');

var asSocket = exports.asSocket = function(incoming, outgoing, icb, ocb) {
    var iStream = new fs.createReadStream(incoming);
    if(typeof icb == 'function') iStream.once('open', function() {
      icb();
    });
    var oStream = new fs.createWriteStream(outgoing);
    if(typeof ocb == 'function') oStream.once('open', function() {
      ocb();
    });

    // Todo define as property
    iStream.writable = oStream.writable;

    function bind(bindee) {
      iStream[bindee] = oStream[bindee].bind(oStream);
    }
    bind('write');
    bind('end');

    function fan(fanee) {
      var originalFunction = iStream[fanee];
      iStream[fanee] = function() {
        originalFunction.apply(iStream, arguments);
        oStream[fanee].apply(oStream, arguments);
      }
    }
    fan('addListener');
    fan('on');
    fan('once');
    fan('removeListener');
    fan('removeAllListeners');
    fan('setMaxListeners');
    fan('destroy');
    fan('destroySoon');

    return iStream;
  }

var dump8 = exports.dump8 = function(data) {
    function b(i) {
      return i < data.length ? hex2(data.readUInt8(i)) : '  ';
    }

    return b(0) + b(1) + b(2) + b(3) + ' ' + b(4) + b(5) + b(6) + b(7);
  }

var hex1 = exports.hex1 = function(nybble) {
    return "0123456789abcdef" [nybble & 0xf];
  }

var hex2 = exports.hex2 = function(int8) {
    return hex1(int8 >> 4) + hex1(int8);
  }

var hex3 = exports.hex3 = function(int12) {
    return hex2(int12 >> 4) + hex1(int12);
  }

var hex6 = exports.hex6 = function(int24) {
    return hex2(int24 >> 16) + hex2(int24 >> 8) + hex2(int24);
  }

var ascii8 = exports.ascii8 = function(data, ptr) {
    if(ptr == null) ptr = 0;

    function asChar(b) {
      return String.fromCharCode(b);
    }

    function ascii(b) {
      return b > 31 && b < 128 ? asChar(b).yellow : '·'.white;
    }

    function b(i) {
      return i + ptr < data.length ? ascii(data.readUInt8(i + ptr)) : ' ';
    }

    return b(0) + b(1) + b(2) + b(3) + b(4) + b(5) + b(6) + b(7);
  }

var hexDump = exports.hexDump = function(data, indent, max) {
    function b(i) {
      return i < data.length ? hex2(data.readUInt8(i)) : '  ';
    }

    indent = indent || '';
    max = max || 4096;
    var length = Math.min(max, data.length);
    var s = '';
    for(var i = 0; i < length; i += 16) {
      s += indent + hex6(i) + '  ';
      for(var j = 0; j < 16; j += 4) {
        s += (b(i + j) + ' ' + b(i + j + 1) + ' ' + b(i + j + 2) + ' ' + b(i + j + 3)).blue + '  ';
      }
      s += '|' + ascii8(data, i) + ascii8(data, i + 8) + '|\n';
    }

    return s;
  }

var dontColor = exports.dontColor = function() {
    var colors = 'cyan yellow blue grey white magenta red green black'.split(' ');
    for(var i in colors)
    Object.defineProperty(String.prototype, colors[i], {
      get: function() {
        return this
      }
    });
  }

/* "BuffOut" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/


exports.OutgoingTools = function(socket) {
  socket.writeUInt8 = function(uint8) {
    socket.write(new Buffer([uint8]));
  };

  socket.writeInt32BE = function(int32) {
    var buffer = new Buffer(4);
    buffer.writeInt32BE(int32, 0);
    socket.write(buffer);
  }

  socket.writeBuffers = function(buffers) {
    if(buffers instanceof Buffer) buffers = [buffers];
    else if(buffers instanceof BufferChain) buffers = buffers.buffers;
    else assert(false, 'buffers is neither a Buffer nor an BufferChain');

    for(var i in buffers) {
      socket.write(buffers[i])
    }
  };

  socket.writeFilled = function(fill, length) {
    var buffer = new Buffer(length);
    buffer.fill(fill);
    this.write(buffer);
  };

  return socket;
};
/**
 * ==============================================================================================
 * some
 * ==============================================================================================
 */
var hexdig      = "0123456789abcdef";
var isprint     = function(c) { return(c > 0x1f && c < 0x7f); } //var isprint=function(a){return 31<a&&127>a};
var lpad        = function(a,b,c){for(;a.length<b;)a=c+a;return a};
var toHex       = function(a){a=a.toString(16).toUpperCase();return lpad(a,2,"0")};
var reverseStr  = function(b){for(var a="",c=0,d=-b.length;c>d;)a+=b.substr(--c,1);return a};
var __C = { BP_OFFSET: 9, BP_GRAPH: 60, BP_LEN: 80 }



exports.hexlog = function(data) {
  var line = new Buffer(__C.BP_LEN);
  for(var i = 0; i < data.length; i++) {
    var n = i % 16;
    var off;
    if(!n) {
      if(i) process.stdout.write(line.toString());
      line.fill(' ');
      off = i % 0x0ffff;
      line[2] = hexdig[0x0f & (off >> 12)].charCodeAt();
      line[3] = hexdig[0x0f & (off >> 8)].charCodeAt();
      line[4] = hexdig[0x0f & (off >> 4)].charCodeAt();
      line[5] = hexdig[0x0f & off].charCodeAt();
      line[6] = ':'.charCodeAt();
    }

    off = __C.BP_OFFSET + n * 3 + ((n >= 8) ? 1 : 0);
    line[off] = hexdig[0x0f & (data[i] >> 4)].charCodeAt();
    line[off + 1] = hexdig[0x0f & data[i]].charCodeAt();

    off = __C.BP_GRAPH + n + ((n >= 8) ? 1 : 0);

    if(isprint(data[i])) {
      line[__C.BP_GRAPH + n] = data[i];
    } else {
      line[__C.BP_GRAPH + n] = '.'.charCodeAt();
    }
  }
  process.stdout.write(line.toString() + "\n");
}