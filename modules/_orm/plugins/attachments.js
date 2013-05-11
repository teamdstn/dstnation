var im    = require("imagemagick");
var fs    = require("fs");
var path  = require("path");
var async = require("async");
var providersRegistry = {};
var supportedDecodingFormats = ["PNG", "GIF", "TIFF", "JPEG"];

function findProvider(name) {
  var provider = providersRegistry[name];
  if (!provider) throw new Error('Storage Provider "' + name + '" can not be found');
  return provider;
}
var plugin = function (schema, options) {
    options = options || {};
    if (typeof options.directory !== "string") throw new Error('option "directory" is required');
    if (typeof options.properties !== "object") throw new Error('option "properties" is required');
    if (typeof options.storage !== "object") throw new Error('option "storage" is required');
    var storageOptions = options.storage;
    storageOptions.schema = schema;
    if (typeof storageOptions.providerName !== "string") throw new Error('option "storage.providerName" is required');
    var providerPrototype = findProvider(storageOptions.providerName);
    var providerOptions = storageOptions.options || {};
    var providerInstance = new providerPrototype(providerOptions);
    var propertyNames = Object.keys(options.properties);
    propertyNames.forEach(function (propertyName) {
      var propertyOptions = options.properties[propertyName];
      if (!propertyOptions) throw new Error('property "' + propertyName + '" requires an specification');
      var styles = propertyOptions.styles || {};
      var styleNames = Object.keys(styles);
      if (styleNames.length == 0) throw new Error('property "' + propertyName + '" needs to define at least one style');
      var addOp = {};
      var propSchema = addOp[propertyName] = {};
      styleNames.forEach(function (styleName) {
        propSchema[styleName] = {
          size: Number,
          oname: String,
          mtime: Date,
          ctime: Date,
          path: String,
          defaultUrl: String,
          format: String,
          depth: Number,
          dims: {
            h: Number,
            w: Number
          }
        };
      });
      schema.add(addOp);
    });
    schema.methods.attach = function (propertyName, attachmentInfo, cb) {
      var selfModel = this;
      if (propertyNames.indexOf(propertyName) == -1) return cb(new Error('property "' + propertyName + '" was not registered as an attachment property'));
      var propertyOptions = options.properties[propertyName];
      var styles = propertyOptions.styles || {};
      if (!attachmentInfo || typeof attachmentInfo !== "object") return cb(new Error("attachmentInfo is not valid"));
      if (typeof attachmentInfo.path !== "string") return cb(new Error("attachmentInfo has no valid path"));
      if (!attachmentInfo.name) {
        attachmentInfo.name = path.basename(attachmentInfo.path);
      }
      path.exists(attachmentInfo.path, function (exists) {
        if (!exists) return cb(new Error('file to attach at path "' + attachmentInfo.path + '" does not exists'));
        fs.stat(attachmentInfo.path, function (err, stats) {
          if (!stats.isFile()) return cb(new Error('path to attach from "' + attachmentInfo.path + '" is not a file'));
          im.identify(attachmentInfo.path, function (err, atts) {
            var canTransform = !! atts && supportedDecodingFormats.indexOf(atts.format) != -1;
            var fileExt = path.extname(attachmentInfo.path);
            var styles = propertyOptions.styles || {};
            var styleNames = Object.keys(styles);
            var tasks = [];
            var stylesToReset = [];
            styleNames.forEach(function (styleName) {
              var styleOptions = styles[styleName] || {};
              var finishConversion = function (styleFilePath, atts, cb) {
                  var ext = path.extname(styleFilePath);
                  var storageStylePath = "/" + options.directory + "/" + selfModel.id + "-" + styleName + ext;
                  fs.stat(styleFilePath, function (err, stats) {
                    if (err) return cb(err);
                    cb(null, {
                      style: {
                        name: styleName,
                        options: styleOptions
                      },
                      filename: styleFilePath,
                      stats: stats,
                      propertyName: propertyName,
                      model: selfModel,
                      path: storageStylePath,
                      defaultUrl: null,
                      features: atts
                    });
                  });
                };
              var optionKeys = Object.keys(styleOptions);
              var transformationNames = [];
              optionKeys.forEach(function (transformationName) {
                if (transformationName.indexOf("$") != 0) {
                  transformationNames.push(transformationName);
                }
              });
              if (optionKeys.length != 0) {
                if (canTransform) {
                  var styleFileExt = styleOptions["$format"] ? "." + styleOptions["$format"] : fileExt;
                  var styleFileName = path.basename(attachmentInfo.path, fileExt);
                  styleFileName += "-" + styleName + styleFileExt;
                  var styleFilePath = path.join(path.dirname(attachmentInfo.path), styleFileName);
                  var convertArgs = [attachmentInfo.path];
                  transformationNames.forEach(function (transformationName) {
                    convertArgs.push("-" + transformationName);
                    convertArgs.push(styleOptions[transformationName]);
                  });
                  convertArgs.push(styleFilePath);
                  tasks.push(function (cb) {
                    im.convert(convertArgs, function (err, stdout, stderr) {
                      if (err) return cb(err);
                      im.identify(styleFilePath, function (err, atts) {
                        if (err) return cb(err);
                        finishConversion(styleFilePath, atts, cb);
                      });
                    });
                  });
                } else {
                  stylesToReset.push(styleName);
                }
              } else {
                tasks.push(function (cb) {
                  finishConversion(attachmentInfo.path, atts, cb);
                });
              }
            });
            async.parallel(tasks, function (err, convertResults) {
              if (err) return cb(err);
              tasks = [];
              convertResults.forEach(function (convertResult) {
                tasks.push(function (cb) {
                  providerInstance.createOrReplace(convertResult, function (err, attachment) {
                    if (err) return cb(err);
                    cb(null, attachment);
                  });
                });
              });
              async.parallel(tasks, function (err, storageResults) {
                if (err) return cb(err);
                var propModel = selfModel[propertyName];
                if (storageResults.length > 0) {
                  storageResults.forEach(function (styleStorage) {
                    var modelStyle = propModel[styleStorage.style.name];
                    modelStyle.defaultUrl = styleStorage.defaultUrl;
                    modelStyle.path = styleStorage.path;
                    modelStyle.size = styleStorage.stats.size;
                    modelStyle.mime = styleStorage.mime;
                    modelStyle.ctime = styleStorage.stats.ctime;
                    modelStyle.mtime = styleStorage.stats.mtime;
                    modelStyle.oname = attachmentInfo.name;
                    if (atts) {
                      modelStyle.format = styleStorage.features.format;
                      modelStyle.depth = styleStorage.features.depth;
                      modelStyle.dims.h = styleStorage.features.height;
                      modelStyle.dims.w = styleStorage.features.width;
                    }
                  });
                }
                stylesToReset.forEach(function (resetStyleName) {
                  var path = [propertyName, resetStyleName].join(".");
                  selfModel.set(path, null);
                });
                cb(null);
              });
            });
          });
        });
      });
    };
  };
function StorageProvider(options) {
  this.options = options;
}
StorageProvider.prototype.update = function (attachment, cb) {
  throw new Error("method update implemented");
};
plugin.StorageProvider = StorageProvider;
plugin.registerStorageProvider = function (name, provider) {
  if (typeof name !== "string") throw new Error("storage engine name is required");
  if (provider && provider._super == StorageProvider) throw new Error("provider is not valid. it does not inherits from StorageEngine");
  providersRegistry[name] = provider;
};
plugin.registerDecodingFormat = function (name) {
  supportedDecodingFormats.push(name);
};
module.exports = plugin;
