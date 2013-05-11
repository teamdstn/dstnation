var crypto = require("crypto");

function nestedPath(obj, path, val) {
  if (typeof obj !== "object") {
    return obj;
  }
  var keys = path.split(".");
  if (keys.length > 1) {
    path = keys.shift();
    return nestedPath(obj[path], keys.join("."), val);
  }
  if (val !== undefined) {
    obj[path] = val;
  }
  return obj[path];
}

function obfuscate(schema, options) {
  options || (options = {});
  var encryptPath = options.encryptPath   || "obfuscate"
    , decryptPath = options.decryptPath   || "deobfuscate"
    , algorithm = options.algorithm       || "aes-256-cbc"
    , key = options.key   || "secret"
    , from = options.from || "utf8"
    , to = options.to     || "hex"
  ;//============================================================
  function encrypt(str) {
    var cipher = crypto.createCipher(algorithm, key),
      crypted = cipher.update(str, from, to) + cipher.final(to);
    return crypted;
  }

  function decrypt(str) {
    var decipher = crypto.createDecipher(algorithm, key),
      dec = decipher.update(str, to, from) + decipher.final(from);
    return dec;
  }

  function encode(schema, doc, toEncrypt) {
    if (!doc) return false;
    var method = toEncrypt ? encrypt : decrypt,
      obj = doc.toObject ? doc.toObject() : doc;
    schema.eachPath(function (name, path) {
      var val = nestedPath(doc, name);
      if (path.instance === "ObjectID" && val) {
        nestedPath(obj, name, method(val.toString()));
      }
      if (path.casterConstructor) {
        if ( !! ~path.casterConstructor.toString().indexOf("ObjectId")) {
          nestedPath(obj, name).forEach(function (v, k) {
            nestedPath(obj, name)[k] = method(val[k].toString());
          });
        } else if ( !! ~path.casterConstructor.toString().indexOf("EmbeddedDocument")) {
          nestedPath(obj, name).forEach(function (v, k) {
            nestedPath(obj, name)[k] = encode(path.schema, val[k], toEncrypt);
          });
        }
      }
    });
    return obj;
  }
  ["method", "static"].forEach(function (method) {
    schema[method]({
      encrypt: encrypt,
      decrypt: decrypt
    });
  });
  schema.static("encode", function (obj, toEncrypt) {
    if (!obj) return false;
    return encode(schema, obj, toEncrypt);
  });
  schema.virtual(encryptPath).get(function () {
    return encode(schema, this, true);
  });
  schema.virtual(decryptPath).set(function (v) {
    var doc = encode(schema, v, false);
    for (var prop in doc) {
      this[prop] = doc[prop];
    }
  });
}

module.exports = obfuscate;
