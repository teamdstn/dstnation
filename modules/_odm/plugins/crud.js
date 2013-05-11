var logger = require("winston");
var _ = require("underscore");
var mongoose = require("mongoose");
var DocumentObjectId = mongoose.Types.ObjectId;
var pkgname = "[mongoose-plugins/crud] ";

exports.crudHelpers = function (schema, options) {
  schema.method.toJSON = function (obj) {
    var o = obj.toObject();
    o.id = o._id;
    delete o._id;
    return o;
  };
  schema.statics.index = function (req, res) {
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + " index called with req:" + JSON.stringify(req.query));
    var query = {};
    _.extend(query, req.query);
    query = _.pick(query, _.without(_.keys(query), "callback", "_", "_method"));
    if (_.isEqual(query, req.query) == false) {
      logger.debug(pkgname + modelName + " modified request:" + JSON.stringify(query));
    }
    this.find(query, function (err, objs) {
      if (!err) {
        res.send(_.map(objs, function (o) {
          return schema.method.toJSON(o);
        }));
      }
    });
  };
  schema.statics.createObject = function (req, res) {
    var model = mongoose.model(this.modelName);
    var record = new model();
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + " CREATE called");
    this.createOrUpdate(req, record, function (err, newObj) {
      if (!err) {
        res.json(schema.method.toJSON(newObj), 201);
      } else {
        res.send(406);
      }
    });
  };
  schema.statics.updateObject = function (record, req, res) {
    this.createOrUpdate(req, record, function (err, newObj) {
      if (!err) {
        res.json(schema.method.toJSON(newObj), 202);
      } else {
        res.send(406);
      }
    });
  };
  schema.statics.showObject = function (record, req, res) {
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + " GET called with req:" + JSON.stringify(req.query));
    if (typeof record == "undefined") {
      logger.error(pkgname + "invalid record passed :" + JSON.stringify(params));
    } else {
      res.json(schema.method.toJSON(record));
    }
  };
  schema.statics.removeObject = function (record, req, res) {
    var modelName = this.modelName.toLowerCase();
    logger.debug(pkgname + modelName + " DELETE called with req:" + JSON.stringify(req.query));
    if (typeof record == "undefined") {
      logger.error(pkgname + "invalid record passed :" + JSON.stringify(params));
    } else {
      logger.info(pkgname + "** removing:" + JSON.stringify(record));
      record.remove(function (err) {
        if (err) {
          logger.error(pkgname + "Error occured while removing :" + err);
          res.send(500);
        } else {
          res.send(200);
        }
      });
    }
  };
  schema.statics.findObject = function (id, cb) {
    var self = this;
    process.nextTick(function () {
      logger.debug(pkgname + "find :" + id);
      self.findById(id, function (err, obj) {
        if (err || obj == null) {
          logger.info(pkgname + "  -- NOT found");
        } else {
          logger.debug(pkgname + "  -- found :" + JSON.stringify(obj));
        }
        cb(err, obj);
      });
    });
  };
  schema.statics.createOrUpdate = function (req, record, cb) {
    var body = req.body;
    var modelName = this.modelName.toLowerCase();
    if (body && body[modelName]) {
      body = body[modelName];
    }
    var query = req.query;
    if (query && query[modelName]) {
      query = query[modelName];
    }
    var params = _.extend(query, body);
    params = _.pick(params, _.without(_.keys(params), "callback", "_", "_method"));
    logger.debug(pkgname + modelName + " update with :" + JSON.stringify(params));
    if (typeof record == "undefined") {
      logger.error(pkgname + "invalid record passed :" + JSON.stringify(params));
      cb("invalid record", record);
      return;
    }
    for (var p in params) {
      if (p && params[p]) {
        var val = params[p];
        if (schema.paths[p] && schema.paths[p].instance == "ObjectId") {
          val = DocumentObjectId.fromString(val);
        }
        logger.debug(pkgname + '  - updating "' + p + '" from "' + record[p] + '" => "' + val + '"');
        record[p] = val;
      }
    }
    logger.info(pkgname + "** updating:" + JSON.stringify(record));
    record.save(function (err) {
      if (err) {
        logger.error(pkgname + "Error occured while saving :" + err);
      }
      cb(err, record);
    });
  };
};
