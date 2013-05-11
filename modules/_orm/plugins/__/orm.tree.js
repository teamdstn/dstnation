var Schema = require('mongoose').Schema;

function tree(schema, options) {
/* "set option" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
	options || (options = {});
  var statPath  = options.statPath  || 'stat'
    , _ref      = options.ref       || null
    , fields    = {}

  var __oid = {
    type : Schema.ObjectId,
    set : function(val) {
      if(typeof(val) === "object" && val._id) {
        return val._id;
      }
      return val;
    },
    index: true
  }

/* "add pathes" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  schema.add({
    parent : __oid,
    meta : {
      path : {
        type : String,
        index: true
      }
    }
  });

	if (!schema.paths[statPath]) {
		fields[statPath] = {
			type : String,
      default: "0"
		}
	}

  schema.add(fields);

/* "schema.pre" : {

  save, remove
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  schema.pre('save', function(next) {
    var isParentChange = this.isModified('parenongot');
    var isStatusChange = this.isModified('stat');
    var modified = isParentChange || isStatusChange;

    //console.log(isParentChange, isStatusChange, modified);

    if(this.isNew || isParentChange || isStatusChange) {
      if(!this.parent) {
        this.meta.path = this._id.toString();
        return next();
      }

      var self = this;

      this.collection.findOne({ _id : this.parent }, function(err, doc) {
        if(err) return next(err);
        var previousPath = self.meta.path;
        self.meta.path = doc.meta.path + '.' + self._id.toString();
        if(modified) {
          // When the parent is changed we must rewrite all children paths as well
          self.collection.find({ meta : {path : { '$regex' : '^' + previousPath + '.' }} }, function(err, cursor) {
            if(err) return next(err);
            var stream = cursor.stream();

            stream.on('data', function (doc) {
              var __set = {$set:{}};

              isParentChange && ( __set.$set.meta.path   = self.meta.path+doc.meta.path.substr(previousPath.length));
              isStatusChange && ( __set.$set.stat   = self.stat);

              self.collection.update({ _id : doc._id }, __set);
            });
            stream.on('close', function() {
              next();
            });
            stream.on('error', function(err) {
              next(err);
            });
          });
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });

  schema.pre('remove', function(next) {
    if(!this.meta.path) {
      return next();
    }
    this.collection.remove({ meta : {path : { '$regex' : '^' + this.meta.path + '.' }} }, next);
  });


/* "pre methods" : {

    getParent, getParent, getAnsestors
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  schema.method('getChildren', function(recursive, cb) {
    if(typeof(recursive) === "function") {
      cb = recursive;
      recursive = false;
    }
    var filter = recursive ? { meta: {path : { $regex : '^' + this.meta.path + '.' }}} : { parent : this._id };
    return this.model(this.constructor.modelName).find(filter, cb);
  });

  schema.method('getParent', function(cb) {
    return this.model(this.constructor.modelName).findOne({ _id : this.parent }, cb);
  });

  schema.method('getAnsestors', function(cb) {
    if(this.meta.path) {
      var ids = this.meta.path.split(".");
      ids.pop();
    } else {
      var ids = [];
    }
    var filter = { _id : { $in : ids } };
    return this.model(this.constructor.modelName).find(filter, cb);
  });

/* "virtual" : {
    level
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  schema.virtual('level').get(function() {
    return this.meta.path ? this.meta.path.split(".").length : 0;
  });
}

module.exports = exports = tree;

