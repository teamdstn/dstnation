var mtrude  = require('./index')
  , utils   = mtrude.utils
  , rtmp    = mtrude.rtmp
  , AMF     = mtrude.AMF
  ;

var dump8   = utils.dump8
  , hex2    = utils.hex2
  , hex6    = utils.hex6
  , ascii8  = utils.ascii8
  , inspect = require("util").inspect
  , dumpZ   = function(buf, mstrm) { return inspect(AMF.deserializeZ(buf, mstrm)); }
  , dump3   = function(buf, mstrm) { return inspect(AMF.deserialize3(buf, mstrm)); }
  , times   = function(s, n) { var _rst = ''; for(var i = 0; i < n; i++) _rst += s; return _rst; }
  ;


console.log('MSG  : %s %s %s %s %s:%s %s\n' + 'PING : %s (%s) %s %s%s%s:%s\n', 'data-1st -8-bytes'.cyan.bold, 'asci i-8c'.yellow, 'tstamp'.cyan.bold, 'ti'.green, 'msg-id'.cyan.bold, 'chs-id'.cyan.bold, 'msglen'.magenta, 'ty'.green, 'PING-TYPE'.green, 'id'.cyan.bold, 'ms'.grey, '                  ', 'msg-id'.cyan.bold, 'chs-id'.cyan.bold);

/* "dump Chunks" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
exports.dumpC = function(cstrm) {
  cstrm.on('error', function(err) {
    console.log('ERROR:', ('cstrm: ' + err).red);
    cstrm.close();
  });

  cstrm.on('end', function(gf) {
    var msg = 'cstrm ' + (gf ? '' : 'not ') + 'gracefully ended';
    console.log('END  :', gf ? msg.green : msg.red);
  });

  cstrm.on('handshake', function() {
    console.log('HANDS: %s', ' Handshake completed successfully'.green);
  });

  cstrm.on('warn', function(message) {
    console.log('WARN : %s', ('cstrm: ' + message).red);
  });

  cstrm.on('info', function(message) {
    console.log('INFO : %s', ('cstrm: ' + message).magenta);
  });

  cstrm.on('chunk', function(chunk) {
    console.log('CHUNK: %s %s %s %s %s:%s %s:%s,%s',
      dump8(chunk.data).cyan.bold,
      ascii8(chunk.data),
      hex6(chunk.timestamp).cyan.bold,
      hex2(chunk.typeid).green,
      hex6(chunk.csid).cyan.bold,
      hex6(chunk.msid).cyan.bold,
      chunk.length.toString().magenta,
      chunk.data.length.toString().cyan.bold,
      chunk.rest.toString().cyan.bold
    );

    if(chunk.typeid === 1) {
      var chunkSize = chunk.data.readUInt32LE(0);
      cstrm.info('Setting chunk size to ' + chunkSize);
      cstrm.chunkSize = chunkSize;
    }

  });
}
/* "dump Messages" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
exports.dumpM = function(mstrm) {

  mstrm.on('error', function(err) {
    console.log('ERROR:', ('mstrm: ' + err).red);
    mstrm.close();
  });

  mstrm.on('warn', function(warn) {
    console.log('WARN :', ('mstrm: ' + warn).red);
  });

  mstrm.on('end', function(gf) {
    var msg = 'mstrm ' + (gf ? '' : 'not ') + 'gracefully ended';
    console.log('END  :', gf ? msg.green : msg.red);
  });

  mstrm.on('message', function(message) {
    console.log('MSG  : %s %s %s %s %s:%s %s',
      dump8(message.data).cyan.bold,
      ascii8(message.data),
      hex6(message.timestamp).cyan.bold,
      hex2(message.typeid).green,
      hex6(message.csid).cyan.bold,
      hex6(message.msid).cyan.bold,
      message.data.length.toString().magenta
    );
  });

  mstrm.on('control', function(control) {
    console.log('CNTRL: %s %s %s %s %s:%s %s',
      dump8(control.data).cyan.bold,
      ascii8(control.data),
      hex6(control.timestamp).cyan.bold,
      hex2(control.typeid).green,
      hex6(control.csid).cyan.bold,
      hex6(control.msid).cyan.bold,
      control.data.length.toString().magenta
    );
  });

  mstrm.on('ping', function(ping) {
    var id = (ping.id == null ? '-' : ping.id).toString();
    var timestamp = ping.timestamp == null ? ping.buflen : ping.timestamp;
    timestamp = (timestamp || '-').toString();
    var pingName = rtmp.pingNames[ping.type];

    console.log('PING : %s (%s) %s %s           %s%s:%s',
      hex2(ping.type).green,
      pingName.green,
      id.toString().cyan.bold,
      timestamp.grey,
      times(' ', 20 - pingName.length - timestamp.length - id.length),
      hex6(ping.csid).cyan.bold,
      hex6(ping.msid).cyan.bold
    );

  });

}
/* "dump AMF" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
exports.dumpA = function(mstrm, ignore) {

  mstrm.on('error', function(msg) {
    console.log('ERROR: %s', msg.red);
    if(!ignore) mstrm.close();
  });

  mstrm.on('warn', function(msg) {
    console.log('WARN : %s', msg.magenta);
    if(!ignore) mstrm.close();
  });

  mstrm.on('end', function(gf) {
    var msg = 'mstrm.amf ' + (gf ? '' : 'not ') + 'gracefully ended';
    console.log('END  :', gf ? msg.green : msg.red);
  });

  mstrm.on('message', function(message) {
    switch(message.typeid) {
    case rtmp.types.INVOKE:
      var o = dumpZ(message.data, mstrm);
      console.log('INVOK: %s:%s %s',
      message.msid,
      message.csid,
      o.magenta
    );
    break;
    case rtmp.types.SO:
      console.log('SHOBJ: %s:%s %s',
      message.msid,
      message.csid,
      dumpZ(message.data, mstrm).yellow
    );
    break;
    case rtmp.types.NOTIFY:
      console.log('NOTIF: %s:%s %s',
      message.msid,
      message.csid,
      dumpZ(message.data, mstrm).cyan.bold
    );
    break;
    case rtmp.types.FLEX:
      console.log('FLEX : %s:%s %s',
      message.msid,
      message.csid,
      dump3(message.data, mstrm).cyan
    );
    break;
    }
  });

}