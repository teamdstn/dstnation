var attachments = require("../attachments");

var knox = require("knox");

var util = require("util");

function S3Storage(options) {
  attachments.StorageProvider.call(this, options);
  this.client = knox.createClient(options);
}

util.inherits(S3Storage, attachments.StorageProvider);

S3Storage.prototype.createOrReplace = function (attachment, cb) {
  var self = this;
  this.client.putFile(attachment.filename, attachment.path, function (err, uploadRes) {
    if (err) return cb(err);
    attachment.defaultUrl = self.client.http(attachment.path);
    cb(null, attachment);
  });
};

attachments.registerStorageProvider("s3", S3Storage);

module.exports = S3Storage;
