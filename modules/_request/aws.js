//[] :____________________
var crypto = require('crypto')
  , parse = require('url').parse
;//_________________________________
var keys = [
    'acl'
  , 'location'
  , 'logging'
  , 'notification'
  , 'partNumber'
  , 'policy'
  , 'requestPayment'
  , 'torrent'
  , 'uploadId'
  , 'uploads'
  , 'versionId'
  , 'versioning'
  , 'versions'
  , 'website'
];

exports.authorization = function(options) {
    return "AWS " + options.key + ":" + exports.sign(options);
};

exports.hmacSha1 = function(options) {
    return crypto.createHmac("sha1", options.secret).update(options.message).digest("base64");
};

exports.sign = function(options) {
    options.message = exports.stringToSign(options);
    return exports.hmacSha1(options);
};

exports.signQuery = function(options) {
    options.message = exports.queryStringToSign(options);
    return exports.hmacSha1(options);
};

exports.stringToSign = function(options) {
    var headers = options.amazonHeaders || "";
    if (headers) headers += "\n";
    return [ options.verb, options.md5, options.contentType, options.date.toUTCString(), headers + options.resource ].join("\n");
};

exports.queryStringToSign = function(options) {
    return "GET\n\n\n" + options.date + "\n" + options.resource;
};

exports.canonicalizeHeaders = function(headers) {
    var buf = [], fields = Object.keys(headers);
    for (var i = 0, len = fields.length; i < len; ++i) {
        var field = fields[i], val = headers[field], field = field.toLowerCase();
        if (0 !== field.indexOf("x-amz")) continue;
        buf.push(field + ":" + val);
    }
    return buf.sort().join("\n");
};

exports.canonicalizeResource = function(resource) {
    var url = parse(resource, true), path = url.pathname, buf = [];
    Object.keys(url.query).forEach(function(key) {
        if (!~keys.indexOf(key)) return;
        var val = "" == url.query[key] ? "" : "=" + encodeURIComponent(url.query[key]);
        buf.push(key + val);
    });
    return path + (buf.length ? "?" + buf.sort().join("&") : "");
};