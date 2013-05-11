var AMF       = require('./_AMF')
  , uparse    = require("url").parse
  , basename  = require("path").basename
  , os        = require('os')
  , hexlog    = require('./utils').hexlog
  , Buffers   = require('buffers')
  ;
var cmdc      = ["connect"];
var cmds      = ["_result"];

var RTMP = exports = module.exports = function() {
  var _couts =[];
  this.__defineGetter__("couts", function() { return _couts; });
  return this;
}

var types = exports.types = {
  CHUNK_SIZE: 1,
  ABORT: 2,
  ACK: 3,
  PING: 4,
  SERVER: 5,    // with Acknowledgement Window Size
  BANDWIDTH: 6, // with Acknowledgement Window Size and Limit type
  AUDIO: 8,
  VIDEO: 9,
  DATA: 15,     // same as NOTIFY but with AMF3
  FLEX_SO: 16,  // same as SO but with AMF 3
  FLEX: 17,     // same as INVOKE but with AMF3
  NOTIFY: 18,
  SO: 19,
  INVOKE: 20,
};

var pings = exports.pings = { BEGIN: 0, EOF: 1, DRY: 2, BUFLEN: 3, RECORDED: 4, PING: 6, PONG: 7, }
exports.typeNames = {};
for (var key in types) exports.typeNames[types[key]] = key;
exports.pingNames = {};
for (var key in pings) exports.pingNames[pings[key]] = key;
exports.isControl = function(typeid) { return typeid >= exports.types.CHUNK_SIZE && typeid <= exports.types.BANDWIDTH;};

var BufferIn = exports.BufferIn = function(buffer, offset) {
  this.buffers = [];
  this._offset = +offset || 0;
  this._length = 0;
  this.push(buffer);
  Object.seal(this);
}
var trace = console.log;

RTMP.CHANNELS	                       = 65600;
RTMP.SIG_SIZE                        = 1536;
RTMP.DEFAULT_CHUNKSIZE               = 128;
RTMP.MAX_HEADER_SIZE                 = 18;

RTMP.PACKET_SIZE_LARGE               = 0;
RTMP.PACKET_SIZE_MEDIUM              = 1;
RTMP.PACKET_SIZE_SMALL               = 2;
RTMP.PACKET_SIZE_MINIMUM             = 3;

/*    RTMP.PACKET_TYPE_...           = 0x00 */
RTMP.PACKET_TYPE_CHUNK_SIZE          = 0x01;
RTMP.PACKET_TYPE_BYTES_READ_REPORT   = 0x03;
RTMP.PACKET_TYPE_CONTROL             = 0x04;
RTMP.PACKET_TYPE_SERVER_BW           = 0x05;
RTMP.PACKET_TYPE_CLIENT_BW           = 0x06;
RTMP.PACKET_TYPE_AUDIO               = 0x08;
RTMP.PACKET_TYPE_VIDEO               = 0x09;
/*    RTMP.PACKET_TYPE_...           = 0x0A */
/*    RTMP.PACKET_TYPE_...           = 0x0B */
/*    RTMP.PACKET_TYPE_...           = 0x0C */
/*    RTMP.PACKET_TYPE_...           = 0x0D */
/*    RTMP.PACKET_TYPE_...           = 0x0E */
RTMP.PACKET_TYPE_FLEX_STREAM_SEND    = 0x0F;
RTMP.PACKET_TYPE_FLEX_SHARED_OBJECT  = 0x10;
RTMP.PACKET_TYPE_FLEX_MESSAGE        = 0x11;
RTMP.PACKET_TYPE_INFO                = 0x12;
RTMP.PACKET_TYPE_SHARED_OBJECT       = 0x13;
RTMP.PACKET_TYPE_INVOKE              = 0x14;
/*      RTMP.PACKET_TYPE_...         = 0x15 */
RTMP.PACKET_TYPE_FLASH_VIDEO         = 0x16;
RTMP.PACKET_TABLE                    = [ 12, 8, 4, 1 ];


var RTMPPacket = exports.Packet = function() {
  this.header = new RTMPPacketHeader();
  this.body = new RTMPPacketBody();
  return this;
}

RTMP.prototype.createPacket = function(packet) {
  var packet = new RTMPPacket();
  return this;
}

RTMP.prototype.createRawPacket = function(packet) {
  var packet = new RTMPPacket();
  return this;
}


var __time = function() {
  var uptime = new Buffer(4);
  uptime.writeUInt32BE(parseInt(os.uptime()) * 1000, 0);
  return uptime;
}

RTMP.prototype.sendPacket = function(options) {
  var self = this;
  var packet = new RTMPPacket();
  options = options || {};
  packet.timestamp  = options.timestamp || 0;
  packet.ptype      = options.typeid;
  packet.cmd        = options.cmd;
  console.log("------------------")
  console.log(options.data)

  console.log("------------------")

  //03 00 00 00 00 00 1F 11 00 00 00 00 00 02 00 07 5F 72 65 73 75 6C 74 00 40 08 00 00 00 00 00 00 05 02 00 07 4D 45 53 53 41 47 45

  console.log("%s".red.bold, self.couts.length);

  var previous  = self.couts[packet.channel || 3];
  var last      = previous && previous.timestamp ? previous.timestamp : 0;
  var rst       = [], raw, interv =
  this.t        = packet.timestamp - last;

  if(previous && (packet.htype !== RTMP.PACKET_SIZE_LARGE)) {
    if((previous.bsize === packet.bsize) && (previous.ptype === packet.ptype) && (packet.htype === RTMP.PACKET_SIZE_MEDIUM))
      packet.htype = RTMP.PACKET_SIZE_SMALL;

    if((previous.timestamp === packet.timestamp) && (packet.htype === RTMP.PACKET_SIZE_SMALL))
      packet.htype = RTMP.PACKET_SIZE_MINIMUM;
  }
  if(packet.htype > 3)
    return console.log("SANITY_FAILED" + packet.htype);

  //var nSize = RTMP.PACKET_TABLE[packet.htype];
  //var hSize = nSize;
  //var cSize = 0;
  packet.header.channel     = options.csid      || 0x03;
  packet.header.htype       = options.htype     || 0;
  packet.header.ptype       = options.typeid    || 0;
  packet.header.timestamp   = options.timestamp || 0;
  //packet.header.infofield   = options.infofield || RTMP.PACKET_TYPE_SERVER_BW;

  packet.body.push(options.cmd);
  packet.body.push(1);
  packet.body.push("MESSAGE");
  self.couts[packet.channel] = packet;
  console.log("------------------")
  console.log(packet)
  hexlog(Buffers(packet.serialize()).slice())
  console.log("------------------")

  return packet.serialize();
}

RTMP.prototype.createConnectPacket = function(cmd, uri) {
  uri && (uri = uparse(uri));
  var self = this;
  var packet = new RTMPPacket(), rst = [], raw;
  packet.header.channel = 0x03;
  packet.header.htype = RTMP.PACKET_SIZE_LARGE;
  packet.header.ptype = RTMP.PACKET_TYPE_INVOKE;
  packet.body.push(cmd);
  packet.body.push(1);
  if(cmdc.indexOf(cmd) > -1) {
    packet.body.push({
      app: basename(uri.path),
      flashVer: "WIN 10,0,32,18",
      tcUrl: uri.href,
      fpad: false,
      capabilities: 15.0,
      audioCodecs: 3191.0,
      videoCodecs: 252.0,
      videoFunction: 1.0,
      objectEncoding: 3.0
    })
  } else if(cmds.indexOf(cmd) > -1) {
    packet.body.push({
      fmsVer: "FMS/4,5,2,517",
      capabilities: 31.0,
      mode: 1.0
    });
    packet.body.push({
      level: 'status',
      code: 'NetConnection.Connect.Success',
      description: 'Connection succeeded.',
      objectEncoding: 3.0
    });
    /*
    packet.body.push({
      data: ""
    });
    packet.body.push({
      version: '4,5,2,517'
    });
    */
  }

  self.couts[packet.channel] = packet;
  return packet.serialize();
};

RTMPPacket.prototype.inheritPrevious = function(previous) {

  if(this.format === 0 || !previous) return;

  this.msid = previous.msid;
  if(this.format === 3) {
    this.timestamp = previous.timestamp;
  }
  if(this.format === 2 || this.format === 3) {
    this.msize  = previous.msize;
    this.mtype  = previous.mtype;
  }
  this.payload += previous.payload;
  console.log("___________________________________\msid: %s timestamp: %s msize: %s mtype: %s offset: %s \n%s",
    this.msid, this.timestamp, this.msize, this.mtype, this.offset,
    "___________________________________");
  console.log("payload\n", this.payload);
  previous.payload = null;
}


RTMPPacket.prototype.serialize = function() {
  this.buffer = new Buffer(4096);
  this.header.bodySize = (this.body.length) ? this.body.serialize(this.buffer.slice(RTMP.MAX_HEADER_SIZE)) : 0;

  var bChunkSize = this.chunkSize || RTMP.DEFAULT_CHUNKSIZE;
  var hOffset = this.header.serialize(this.buffer, RTMP.MAX_HEADER_SIZE);
  var hSize = RTMP.MAX_HEADER_SIZE - hOffset;
  var bOffset = RTMP.MAX_HEADER_SIZE;
  var packetSize = this.header.bodySize;

  //128 6 12 18 29
  console.log(bChunkSize, hOffset, hSize, bOffset, packetSize);

  var chunks = [this.buffer.slice(hOffset, RTMP.MAX_HEADER_SIZE)];
  while(packetSize) {
    if(packetSize < bChunkSize) {
      bChunkSize = packetSize;
    }

    chunks.push(this.buffer.slice(bOffset, bOffset + bChunkSize));
    packetSize -= bChunkSize;
    bOffset += bChunkSize;
    if(packetSize > 0) {
      chunks.push(this.header.chunkHeader());
    }
  }
  //return this.buffer.slice(hOffset, RTMP.MAX_HEADER_SIZE+this.header.bodySize);
  return chunks;
};

function RTMPPacketHeader(options) {
  options = options || {};
  this._headerType      = options.htype           || RTMP.PACKET_SIZE_LARGE;
  this.hasAbsTimestamp  = options.hasAbsTimestamp || 0;
  this.timestamp        = options.timestamp       || 0;
  this.channel          = options.channel         || 0;
  this.infofield        = options.infofield       || 0;
  this.ptype            = options.ptype           || 0;

  this.__defineGetter__("htype", function() {
    return this._headerType;
  });
  this.__defineSetter__("htype", function(htype) {
    if(htype > 3 || htype < 0) return console.log("SANITY_FAILED : " + htype);
    this._headerType = htype;
  });
};

RTMPPacketHeader.prototype.serialize = function(buf, end) {
  var nSize = RTMP.PACKET_TABLE[this.htype];
  var hSize = nSize;
  var cSize = 0;
  var t = this.timestamp; // - last
  var hOffset = 0;

  if(this.bodySize) {
    hOffset = end - nSize;
  } else {
    hOffset = 6;
  }
  if(this.channel > 319) cSize = 2;
  else if(this.channel > 63) cSize = 1;
  if(cSize) {
    hOffset -= cSize;
    hSize += cSize;
  }
  if(nSize > 1 && t >= 0xffffff) {
    hOffset -= 4;
    hSize += 4;
  }
  var hPos = hOffset;
  var c = this.htype << 6;
  switch(cSize) {
  case 0:
    c |= this.channel;
    break;
  case 1:
    break;
  case 2:
    c |= 1;
    break;
  }
  buf[hPos++] = c;
  if(cSize) {
    var tmp = this.channel - 64;
    buf[hPos++] = tmp & 0xff;
    if(cSize == 2) buf[hPos++] = tmp >> 8;
  }
  var _AMF = new AMF(buf);
  if(nSize > 1) {
    hPos += _AMF.writeInt24((t > 0xffffff) ? 0xffffff : t, hPos);
  }
  if(nSize > 4) {
    hPos += _AMF.writeInt24(this.bodySize, hPos);
    buf[hPos++] = this.ptype;
  }
  if(nSize > 8) {
    buf.writeInt32LE(this.infofield, hPos);
    hPos += 4;
  }
  if(nSize > 1 && t >= 0xffffff) {
    hPos += _AMF.writeInt32(t, hPos);
  }
  console.log(hOffset);
  return hOffset;
};


RTMPPacketHeader.prototype.chunkHeader = function() {
  var cSize = 0;
  if(this.channel > 319) cSize = 2;
  else if(this.channel > 63) cSize = 1;
  hSize = (cSize) ? cSize + 1 : 1;
  var header = new Buffer(hSize);
  var c = this.htype << 6;
  switch(cSize) {
  case 0:
    c |= this.channel;
    break;
  case 1:
    break;
  case 2:
    c |= 1;
    break;
  }
  header[0] = (0xc0 | c);
  if(cSize) {
    var tmp = this.channel - 64;
    header[1] = tmp & 0xff;
    if(cSize == 2) header[2] = tmp >> 8;
  }
  return header;
};
function RTMPPacketBody() {
};
RTMPPacketBody.prototype = [];
RTMPPacketBody.prototype.constructor = RTMPPacketBody;
RTMPPacketBody.prototype.serialize = function(buf) {
  var bPos = 0;
  var _AMF = new AMF(buf);
  for(var i = 0; i < this.length; i++) {
    bPos += _AMF.write(this[i], bPos);
  }
  return bPos;
};
/**
 * ==============================================================================================
 * o
 * ==============================================================================================
 */
/*
var RTMPChunk = exports.Chunk = function() {
  var chunks   = this.chunks;
  var self     = this;
  self.csize    = RTMP.DEFAULT_CHUNKSIZE;
  var cnt = 0;
  self.state = 'chunk';
  return function(data){
    function id(chunks) { return chunks.csid + ':' + chunks.msid }
    chunks = self;
    self.buffers = new BufferIn(data);
    chunks.payload  = "";
    if(self.state === 'chunk'){
      var csid        = self.buffers.consumeUInt8();
      chunks.fmt      = csid >>> 6;
      chunks.csid     = csid & 0x3f;
      chunks.offset   = 1;
      chunks.rests    = [];
      chunks.count    = cnt++;
      chunks.hsize    = RTMP.PACKET_TABLE[chunks.fmt];
    }
    self.state = 'chunk' + chunks.csid;
    if(self.state === 'chunk0'){
      if (self._waitFor(1)) return;
      chunks.csid = self.buffers.consumeUInt8() + 64;
      chunks.offset++;
      self.state = 'chunkType' + chunks.fmt;
      trace('chunks', chunks);
    }else if(self.state === 'chunk1'){
      if (self._waitFor(2)) return;
      chunks.csid = self.buffers.consumeUInt16BE() + 64;
      chunks.offset += 2
      self.state = 'chunkType' + chunks.fmt;
      trace('chunks', chunks);
    }else{
      self.state = 'chunkType' + chunks.fmt;
    }
    if(self.state === "chunkType0"){
      chunks.timestamp = self.buffers.consumeUInt24BE();
      chunks.size      = self.buffers.consumeUInt24BE();
      chunks.typeid    = self.buffers.consumeUInt8();
      chunks.msid      = self.buffers.consumeInt32BE();
      chunks.rests[id(chunks)] = chunks.size - chunks.offset - 12;
      if (chunks.timestamp === 0xffffff)
        return console.log("Extended Timestamp not supported");
    }else if(self.state === "chunkType1"){
      chunks.timestamp = self.buffers.consumeUInt24BE();
      chunks.size      = self.buffers.consumeUInt24BE();
      chunks.typeid    = self.buffers.consumeUInt8();
      chunks.rests[id(chunks)] = chunks.length - chunks.offset - 8;
      if (chunks.timestamp === 0xffffff)
        return console.log("Extended Timestamp not supported");
    } else if(self.state === "chunkType3"){
      chunks.rests[id(chunks)] -= 1;
      self.state = 'chunkData';
    }
    if(self.state === "chunkData"){
      var rest = chunks.rests[id(chunks)];
      trace('       chunkData length', chunks.size, 'rest', rest);
      var _size = Math.min(self.csize, rest);
      if (self._waitFor(_size)) return false;
      var _rest = chunks.rests[id(chunks)] -= _size;
      var _data = self.buffers.consumeBuffers(_size);
      var chunk = self.newChunk(chunks, chunks.msid, chunks.timestamp, chunks.size, chunks.typeid, _data, _rest);
      self.state = 'chunk';
    }
    var rest = chunks.rests[id(chunks)];
    console.log("%s".yellow.bold, rest);
    trace('       chunkData length', chunks.size, 'rest', rest);
    var _size = Math.min(csize, rest);
    console.log("%s".red.bold, _size);
    console.log(chunks);
    //this.payload += data.slice(this.offset + this.size);
  }
  this.payload = "";
  var B1 = data[0];
  this.csid = B1&63;
  if(this.csid === 0) {
    this.csid = data.readUInt8(1) + 64;
    this.offset = 2;
  }else if(sid === 1) {
    this.csid = (data.readUInt8(2) * 256) + data.readUInt8(1) + 64;
    this.offset = 3;
  }else{
    this.offset = 1;
  }
  this.format = B1&192;
  this.hsize = RTMP.PACKET_TABLE[this.format];
  console.log("___________________________________\nB1: %s csid: %s format: %s hsize: %s offset: %s \n%s",
    B1, this.csid, this.format, this.hsize, this.offset,
    "___________________________________");
}
RTMPChunk.prototype._waitFor = function(length) {
  trace('       waitFor() this.buffers.length', this.buffers.length,
    'length', length, 'result', this.buffers.length <= length);
  return this.buffers.length <= length;
}
RTMPChunk.prototype.newChunk = function (chunks, msid, timestamp, length, typeid, cdata, rest) {
  return {
    timestamp: timestamp,
    length:    length,
    typeid:    typeid,
    msid:      msid,
    csid:      chunks.csid,
    data:      cdata,
    rest:      rest,
  };
}
 */
