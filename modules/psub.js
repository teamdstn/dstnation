//[] :____________________
var a = "a"
  , b = "b"
  , c = "c"
;//_________________________________
exports.Batch         = require('./_psub/batch');
exports.Parser        = require('./_psub/parser');
exports.Message       = require('./_psub/message');

exports.Socket        = require('./_psub/sockets/sock');
exports.PubSocket     = require('./_psub/sockets/pub');
exports.SubSocket     = require('./_psub/sockets/sub');
exports.PushSocket    = require('./_psub/sockets/push');
exports.PullSocket    = require('./_psub/sockets/pull');
exports.EmitterSocket = require('./_psub/sockets/emitter');
exports.ReqSocket     = require('./_psub/sockets/req');
exports.RepSocket     = require('./_psub/sockets/rep');

exports.types = {
  stream: exports.Socket,
  pub: exports.PubSocket,
  sub: exports.SubSocket,
  push: exports.PushSocket,
  pull: exports.PullSocket,
  emitter: exports.EmitterSocket,
  req: exports.ReqSocket,
  rep: exports.RepSocket
};

/**
 * Codecs.
 */

exports.codec = require('./_psub/codecs');

/**
 * Return a new socket of the given `type`.
 *
 * @param {String} type
 * @param {Object} options
 * @return {Socket}
 * @api public
 */

exports.socket = function(type, options){
  var fn = exports.types[type];
  if (!fn) throw new Error('invalid socket type "' + type + '"');
  return new fn(options);
};