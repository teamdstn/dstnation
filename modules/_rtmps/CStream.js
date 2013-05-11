"use strict";
var net     = require('net');
var util    = require('util');
var assert  = require('assert');
var events  = require('events');
var mtrude  = require('./index');

var EventEmitter  = events.EventEmitter;
var BufferChain   = mtrude.utils.BufferChain;
var OutgoingTools = mtrude.utils.OutgoingTools;

function dbg() { if (CStream.DBG) console.log.apply(console, arguments) }

/**
 * RTMP CStream: the lowest-level possible layer of RTMP. Even the
 * protocol control message 1, Set Chunk Size (RTMCSP 7.1) is not implemented
 * here. This layer and the next layer (RTMP MessageStream) are tightly
 * coupled: MessageStream must set chunk size or mis-synchronization occurs.
 * Therefore this layer is an internal implementation detail of mtrude.
 *
 * CStream emits these events:
 *   'error': function(message) {}
 *       Emitted on networking or protocol errors
 *   'warn': function(message) {}
 *       Emitted on potential problems
 *   'info': function(message) {}
 *       Emitted if something special has been found but which poses no problem
 *   'end' function(graceful) {}
 *       Emitted on disconnect from other end (graceful or not)
 *   'handshake' function(deltaTime) {}
 *       Emitted on succesful handshake. deltaTime is the time difference
 *       between the first and the second package from the other side.
 *   'chunk' function(chunk) {}
 *       Emitted on received chunk. chunk has the fields
 *         csid:      Chunk Stream ID
 *         timestamp: Chunk timestamp (milliseconds, increasing and wrapping)
 *         length:    Chunk length in bytes
 *         rest:      Remaining data length in bytes
 *         typeid:    Message type ID
 *         msid:      Message Stream ID
 *         data:      Chunk payload
 *
 * CStream has these methods:
 *   send(chunk) send a chunk
 *   close()     close the connection
 *
 * CStream has these properties:
 *   socket     can also be a bidirectional stream. socket.write() and the
 *     events 'data', 'end' and 'error' must do the 'right' things. Readonly.
 *   buffers   incoming buffer list. Readonly.
 *   chunks    metadata about chunks.
 *   chunkSize low level property of RTMSCP (6. and 7.1).
 *   state     of RTMSCP parser.
 *
 * Constructor: new CStream(socket, state, init, offset)
 *   socket: socket or bidirectional stream
 *   state: starting state (default 'handshake0Server')
 *   init: initial buffer or buffer list (default empty)
 *   offset: initial offset in init (default 0)
*/
function CStream(socket, state, init, offset) {
  var it = this;
  EventEmitter.call(it);

  it._socket = OutgoingTools(socket);
  it._buffers = new BufferChain(init, offset);
  it._chunks = {};
  it._state = 'handshake0Server';
  it.chunkSize = 128;
  if (state) it.state = state;

  it.socket.on('data',
    function(buffer) {
      var length = it.buffers.length;
      var ok = it.buffers.push(buffer);
      dbg('data :', 'data read', buffer.length, 'length',
        length, '->', it.buffers.length);

      if (ok) it._loop(); else it.error('ReadStream data: not a buffer');
    });

  it.socket.on('end',
    function() {
      it._loop();
      it.emit('end', it.state == 'chunk')
      it.state = 'dead';
    });

  it.socket.on('error', function(error) { it.error(error.message); } );

  it._loop();
}

CStream.DBG = false;

util.inherits(CStream, EventEmitter);


// === Prototype ==
var p = CStream.prototype;

p._waitFor = function(length) {
  dbg('       waitFor() this.buffers.length', this.buffers.length,
    'length', length, 'result', this.buffers.length <= length);
  return this.buffers.length <= length;
}

p._loop = function() {
  while (true) {
    var state = this.state;
    dbg('work :', state);
    var okay = this[this.state]();
    if (okay) dbg('done :', state, '->', this.state);
    else break;
  }
}

p.error = function(errorText) {
  if (this.state == 'dead') return;
  this.emit('error', errorText);
  this.close();
}

p.warn = function(warnText) {
  this.emit('warn', warnText);
}

p.info = function(warnText) {
  this.emit('info', warnText);
}

p.close = function() {
  var it = this;

  it.state = 'dead';
  it.once('drain', function() { it.destroy(); console.log(new Error()) });
}

p.send = function(chunk, cb) {
  if (chunk.msid != null) return send0(this.socket, chunk, cb);
  if (chunk.typeid != null) return send1(this.socket, chunk, cb);
  if (chunk.timestamp != null) return send2(this.socket, chunk, cb);
  return send3(this.socket, chunk);
}

function createHeader(fmt, csid, typeLength) {
  assert(fmt >= 0 && fmt <= 3);

  var headerType = -1;
  if (csid >= 2 && csid < 64) headerType = 1;
  if (csid >= 64 && csid < 320) headerType = 2;
  if (csid >= 320 && csid < 65599) headerType = 3;
  if (headerType == -1) throw new Error('illegal csid ' + csid);

  var buffer = new Buffer(typeLength + headerType);
  switch (headerType) {
    case 1: buffer[0] = fmt | csid << 6; break;
    case 2: buffer[0] = fmt; buffer[1] = csid - 64; break;
    case 3: buffer[0] = fmt | 1 << 6; buffer.writeInt16BE(csid - 64, 1); break;
  }
  return {buffer: buffer, type: headerType};
}

function writeUInt24BE(buffer, value, offset) {
  buffer.writeUInt16BE(value >> 8, offset + 1);
  buffer.writeUInt8(value & 0xff, offset);
}

function send0(socket, chunk, cb) {
  var header = createHeader(0, chunk.csid, 11);

  if (chunk.timeStamp > 0xfffffe) throw new Error('unsupported timestamp');
  writeUInt24BE(header.buffer, chunk.timestamp, header.type);

  if (chunk.length > 0xffffff) throw new Error('invalid length');
  writeUInt24BE(header.buffer, chunk.length, header.type + 3);

  if (chunk.typeid > 255) throw new Error('invalid typeid');
  header.buffer.writeUInt8(chunk.typeid, header.type + 6);
  header.buffer.writeInt32BE(chunk.msid, header.type + 7);
  console.log("send0");
  //socket.write(header.buffer);
  //socket.writeBuffers(chunk.data);
  return cb && cb(null, [header.buffer, chunk.data]);
}

function send1(socket, chunk, cb) {
  var __err = "UNSPRT chunk type 1";
  return cb ? cb(__err) : console.log(__err);
}

function send2(socket, chunk, cb) {
  var __err = "UNSPRT chunk type 2";
  return cb ? cb(__err) : console.log(__err);
}

function send3(socket, chunk, cb) {
  //socket.write(createHeader(3, csid, 0).header);
  //socket.write(chunk.data);
  console.log("send3");
  return cb && cb(null, [header.buffer, chunk.data]);
}


Object.defineProperties(p, {
  state: {
    get: function() { return this._state; },
    set: function(state) {
      if (!(state in CStream.states)) this.error(
        'state ' + state + ' does not exist');

      if (this._state != 'dead') this._state = state;
    },
  },
  time: {
    get: function() { return new Date().getTime() & 0xffffffff; }
  },
  socket: {
    get: function() { return this._socket; },
  },
  buffers: {
    get: function() { return this._buffers; },
  },
  chunks: {
    get: function() { return this._chunks; },
  },
  chunkSize: {
    get: function() { return this._chunkSize; },
    set: function(chunkSize) {
      if (isNaN(chunkSize) || chunkSize < 128 || chunkSize > 65536)
        this.warn('Illegal chunk size ' + chunkSize + ' ignored');
      else this._chunkSize = chunkSize;
    },
  }
});


// === State handlers ===

CStream.states = {}
var s = CStream.states;

s.ready = function() { // RTMCSP 5.2 Handshake C0, S0 and S1

}

s.handshake0Server = function(buff) { // RTMCSP 5.2 Handshake C0, S0 and S1
  if (this._waitFor(1)) return false;

  var version = this.buffers.consumeUInt8(); // C0: RTMP version client
  //this.socket.writeUInt8(3);                 // S0: RTMP version server
  //this.socket.writeInt32BE(this.time);       // S1: Timestamp
  //this.socket.writeInt32BE(0);               // S1: Timestamp zero
  //this.socket.writeFilled(0xc5, 1528);       // S1: Random data
  this.state = 'handshake1Server';
  this.emit('status', 'handshake0');
  if (version > 32) this.error('Not RTMP');
  else if (version != 3) this.warn('RTMP version is not 3, but ' + version);

  return true;
}

s.handshake1Server = function() { // RTMCSP 5.3 Handshake C1 and S2
  if (this._waitFor(1536)) return false;

  var clientTime = this.buffers.consumeInt32BE();  // C1: Timestamp
  this.buffers.consumeInt32BE();                   // C1: TS zero: ignore
  var data = this.buffers.consumeBuffers(1528);    // C1: Random data
  //this.socket.writeInt32BE(clientTime);          // S2: Timestamp back
  //this.socket.writeInt32BE(this.time);           // S2: Timestamp 2
  //this.socket.writeBuffers(data);                // S2: C1 data back
  this.emit('status', 'handshake1');
  this.state = 'handshake2Server';
  return true;
}

s.handshake2Server = function() { // RTMCSP 5.3 Handshake C2
  if (this._waitFor(1536)) return false;

  this.buffers.consume(1536);  // C2: Timestamp back; two; data back: ignore

  // Handshake has ended. Initialize chunks and start chunking.
  this.emit('handshake');

  this.chunks.chunkCounter = 0;
  this.chunks.rests = {};           // rest lengths for each stream
  this.state = 'chunk';

  return true;
}

// 'chunk' is a good waiting and a graceful end state.
s.chunk = function() { // RTMCSP 6.1.1 Chunk Basic Header 1 (csid > 1)
  if (this._waitFor(1)) return false;

  var csid = this.buffers.consumeUInt8();
  var chunks = this.chunks;
  chunks.fmt = csid >>> 6;
  chunks.csid = csid & 0x3f;
  chunks.count = chunks.chunkCounter++;

  if (chunks.csid == 0 || chunks.csid == 1) {
    this.state = 'chunk' + chunks.csid;
  }
  else {
    this.state = 'chunkType' + chunks.fmt;
  }

  return true;
}

s.chunk0 = function() { // RTMCSP 6.1.1 Chunk Basic Header 2 (csid == 0)
  if (this._waitFor(1)) return false;

  this.chunks.csid = this.buffers.consumeUInt8() + 64;
  this.state = 'chunkType' + this.chunks.fmt;

  return true;
}

s.chunk1 = function() { // RTMCSP 6.1.1 Chunk Basic Header 3 (csid == 1)
  if (this._waitFor(2)) return false;

  this.chunks.csid = this.buffers.consumeUInt16BE() + 64;
  this.state = 'chunkType' + chunks.fmt;

  return true;
}

function newChunk(chunks, msid, timestamp, length, typeid, data, rest) {
  return {
    timestamp: timestamp,
    length:    length,
    typeid:    typeid,
    msid:      msid,
    csid:      chunks.csid,
    data:      data,
    rest:      rest,
  };
}

function id(chunks) { return chunks.csid + ':' + chunks.msid }

s.chunkType0 = function() { // RTMCSP 6.1.2.1 Chunk Type 0; start message
  if (this._waitFor(11)) return false;

  var chunks = this.chunks;
  chunks.timestamp = this.buffers.consumeUInt24BE();
  chunks.length = this.buffers.consumeUInt24BE();
  chunks.typeid = this.buffers.consumeUInt8();
  chunks.msid = this.buffers.consumeInt32BE();
  chunks.rests[id(chunks)] = chunks.length;

  if (chunks.timestamp === 0xffffff)
    return this.error("Extended Timestamp not supported");

  this.state = 'chunkData';
  return true;
};

s.chunkType1 = function() { // RTMCSP 6.1.2.2 Chunk Type 1; start message
  if (this._waitFor(7)) return false;                    // same msid

  var chunks = this.chunks;
  chunks.timestamp = this.buffers.consumeUInt24BE();
  chunks.length = this.buffers.consumeUInt24BE();
  chunks.typeid = this.buffers.consumeUInt8();
  chunks.rests[id(chunks)] = chunks.length;

  if (chunks.timestamp === 0xffffff)
    return this.error("Extended Timestamp not supported");

  this.state = 'chunkData';
  return true;
};

function resetLengthIfNewMessage(chunks) {
  if (chunks.rests[id(chunks)] === 0) chunks.rests[id(chunks)] = chunks.length;
}


s.chunkType2 = function() { // RTMCSP 6.1.2.4 Chunk Type 2; additional chunk
  if (this._waitFor(3)) return false;      // ^-- new message if rest == 0

  var chunks = this.chunks;
  chunks.timestamp = this.buffers.consumeUInt24BE();
  resetLengthIfNewMessage(chunks);

  this.info('chunkType2 timestamp 0x' + chunks.timestamp.toString(16));

  if (chunks.timestamp === 0xffffff)
    return this.error("Extended Timestamp not supported");

  this.state = 'chunkData';
  return true;
};

s.chunkType3 = function() { // RTMCSP 6.1.2.4 Chunk Type 3; additional chunk
  this.state = 'chunkData';                // ^-- new message if rest == 0

  var chunks = this.chunks;
  resetLengthIfNewMessage(chunks);

  return true;
};

s.chunkData = function() { // RTMCSP 6.1 Chunk Data
  var chunks = this.chunks;
  var rest = chunks.rests[id(chunks)];
  dbg('       chunkData length', chunks.length, 'rest', rest);

  var length = Math.min(this.chunkSize, rest);
  if (this._waitFor(length)) return false;

  rest = chunks.rests[id(chunks)] -= length;

  var data = this.buffers.consumeBuffers(length);
  var chunk = newChunk(chunks, chunks.msid, chunks.timestamp, chunks.length,
    chunks.typeid, data, rest);
  dbg('emit : chunk timestamp=%s typeid=%s %s:%s length=',
    chunk.timestamp, chunk.typeid, chunk.csid, chunk.msid, chunk.data.length);
  this.emit('chunk', chunk);

  this.state = 'chunk';
  return true;
};

s.dead = function() {
  return this.error('CStream is dead');
};


// === State handler registrator ===

for (var state in s) {
  if (CStream.prototype[state] != null)
    new Error(state + ' conflicts with a prototype member of same name');

  CStream.prototype[state] = s[state];
  Object.freeze(CStream.prototype[state]);
}

Object.freeze(CStream.states);
Object.freeze(CStream.prototype);
Object.seal(CStream);

module.exports = CStream;


