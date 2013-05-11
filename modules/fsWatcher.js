(function () {
  "use strict";

  var EventEmitter = require("events").EventEmitter
    , fs = require("fs")
    , sysPath = require("path")
    , nodeVersion = process.versions.node.substring(0, 3)
    , __bind = function (fn, me) { return function () { return fn.apply(me, arguments); };}
    , __hasProp = {}.hasOwnProperty
    , __extends = function (child, parent) {
      for (var key in parent) {
        if (__hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor() { this.constructor = child; }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
      child.__super__ = parent.prototype;
      return child;
    }
    , __slice = [].slice
  ;//=====================================================
  var FSWatcher = exports.FSWatcher = function (_super) {
    __extends(FSWatcher, _super);
    function FSWatcher(options) {
      var self = this, _base, _ref;

      this.options = options || {};
      this.add          = __bind(this.add, this);
      this.close        = __bind(this.close, this);
      this._handle      = __bind(this._handle, this);
      this._handleDir   = __bind(this._handleDir, this);
      this._handleFile  = __bind(this._handleFile, this);
      this._watch       = __bind(this._watch, this);
      this._remove      = __bind(this._remove, this);
      this._removeFromWatchedDir  = __bind(this._removeFromWatchedDir, this);
      this._addToWatchedDir       = __bind(this._addToWatchedDir, this);
      this._getWatchedDir         = __bind(this._getWatchedDir, this);
      this.watched                = Object.create(null);
      this.watchers               = [];

      if ((_ref = (_base = this.options).persistent) == null) { _base.persistent = false; }

      this._ignored = function () {
        switch (toString.call(self.options.ignored)) {
        case "[object RegExp]":
          return function (string) {
            return this.options.ignored.test(string);
          };

        case "[object Function]":
          return self.options.ignored;

        default:
          return function () {
            return false;
          };
        }
      }();
    }
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._getWatchedDir = function (directory) {
      var dir, _base, _ref;
      dir = directory.replace(/[\\\/]$/, "");
      return (_ref = (_base = this.watched)[dir]) != null ? _ref : _base[dir] = [];
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._addToWatchedDir = function (directory, file) {
      var watchedFiles;
      watchedFiles = this._getWatchedDir(directory);
      return watchedFiles.push(file);
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._removeFromWatchedDir = function (directory, file) {
      var watchedFiles, self = this;
      watchedFiles = this._getWatchedDir(directory);
      return watchedFiles.some(function (watchedFile, index) {
        if (watchedFile === file) {
          watchedFiles.splice(index, 1);
          return true;
        }
      });
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._remove = function (directory, item) {
      var fullPath, nestedDirectoryChildren, self = this;
      fullPath = sysPath.join(directory, item);
      nestedDirectoryChildren = this._getWatchedDir(fullPath).slice();
      this._removeFromWatchedDir(directory, item);
      nestedDirectoryChildren.forEach(function (nestedItem) {
        return self._remove(fullPath, nestedItem);
      });
      fs.unwatchFile(fullPath);
      return this.emit("unlink", fullPath);
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._watch = function (item, itemType, callback) {
      var basename, directory, options, parent, watcher, self = this;
      if (callback == null) {
        callback = function () {};
      }
      directory = sysPath.dirname(item);
      basename = sysPath.basename(item);
      parent = this._getWatchedDir(directory);
      options = {
        persistent: this.options.persistent
      };
      if (parent.indexOf(basename) >= 0) {
        return;
      }
      this._addToWatchedDir(directory, basename);
      if (process.platform === "win32" && nodeVersion === "0.6") {
        watcher = fs.watch(item, options, function (event, path) {
          return callback(item);
        });
        this.watchers.push(watcher);
      } else {
        options.interval = 100;
        fs.watchFile(item, options, function (curr, prev) {
          if (curr.mtime.getTime() !== prev.mtime.getTime()) {
            return callback(item);
          }
        });
      }
      if (itemType === "file") {
        return this.emit("add", item);
      }
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._handleFile = function (file) {
      var self = this;
      return this._watch(file, "file", function (file) {
        return self.emit("change", file);
      });
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._handleDir = function (directory) {
      var read, self = this;
      read = function (directory) {
        return fs.readdir(directory, function (error, current) {
          var previous;
          if (error != null) {
            return self.emit("error", error);
          }
          if (!current) {
            return;
          }
          previous = self._getWatchedDir(directory);
          previous.filter(function (file) {
            return current.indexOf(file) < 0;
          }).forEach(function (file) {
            return self._remove(directory, file);
          });
          return current.filter(function (file) {
            return previous.indexOf(file) < 0;
          }).forEach(function (file) {
            return self._handle(sysPath.join(directory, file));
          });
        });
      };
      read(directory);
      return this._watch(directory, "directory", read);
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype._handle = function (item) {
      var self = this;
      if (this._ignored(item)) {
        return;
      }
      return fs.realpath(item, function (error, path) {
        if (error != null) {
          return self.emit("error", error);
        }
        return fs.stat(item, function (error, stats) {
          if (error != null) {
            return self.emit("error", error);
          }
          if (stats.isFile()) {
            self._handleFile(item);
          }
          if (stats.isDirectory()) {
            return self._handleDir(item);
          }
        });
      });
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype.emit = function () {
      var args, event;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      FSWatcher.__super__.emit.apply(this, arguments);
      if (event === "add" || event === "change" || event === "unlink") {
        return FSWatcher.__super__.emit.apply(this, ["all", event].concat(__slice.call(args)));
      }
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype.add = function (files) {
      if (!Array.isArray(files)) {
        files = [files];
      }
      files.forEach(this._handle);
      return this;
    };
  /*
  ━━━━━━━━━━━━━━━━━
   _handle
  ━━━━━━━━━━━━━━━━━
  */
    FSWatcher.prototype.close = function () {
      var self = this;
      this.watchers.forEach(function (watcher) {
        return watcher.close();
      });
      Object.keys(this.watched).forEach(function (directory) {
        return self.watched[directory].forEach(function (file) {
          return fs.unwatchFile(sysPath.join(directory, file));
        });
      });
      this.watched = Object.create(null);
      return this;
    };
    return FSWatcher;
  }(EventEmitter);

  exports.watch = function (files, options) { return new FSWatcher(options).add(files);};

}).call(this);
