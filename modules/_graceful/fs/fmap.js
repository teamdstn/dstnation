var EventEmitter = require("events").EventEmitter
  , fs = require("fs")
  , pt = require("path")
;//_________________________________

!fs.graceful && (require("./fs"));

exports = module.exports = createFileMap;
exports.FileMap = FileMap;

function createPath(obj, pth, value) {
  var k, i;
  for (i in pth) { k = pth[i]; !obj.hasOwnProperty(k) && (obj[k] = ((+i + 1 === pth.length) ? value : {})); obj = obj[k]; }
};

function createFileMap(path, options) {
  Object(path) === path && (path=options, path=null);
  var fmap = new FileMap(options);
  if(path) fmap.walk(path);
  return fmap;
}

function FileMap(options) {
  options = options || {};
  !options.exclude && (options.exclude= [])
  !options.ignores && (options.ignores= { "." : true })
  !options.root    && (options.root = process.cwd())

  this.conf         = options;
  this.root         = this.conf.root;
  this.files        = [];
  this.events       = new EventEmitter();
  this.filesLeft    = 0;
  this.dirsLeft     = 1;
  this.dmap         = {};
}

FileMap.prototype.fileType = function(fileName) {
  var extension = pt.extname(fileName).substring(1);
  if (fileName.match(/[\/\\]_posts[\/\\]/)) {
      return "post " + extension;
  } else if (fileName.match(/[\/\\]_layouts[\/\\]/)) {
      return "layout " + extension;
  } else if (fileName.match(/[\/\\]_includes[\/\\]/)) {
      return "include " + extension;
  } else if ([ "jade", "ejs", "styl" ].indexOf(extension) !== -1) {
      return "file " + extension;
  } else {
      return "file";
  }
};

FileMap.prototype.walk = function(dir) {
    if (!dir) dir = this.root;
    var self = this;
    fs.readdir(dir, function(err, files) {
        self.dirsLeft--;
        if (!files) return;
        files.forEach(function(file) {
            file = pt.join(dir, file);
            self.filesLeft++;
            fs.stat(file, function(err, stats) {
                if (err) console.error("Error:", err);
                if (!stats) return;
                if (stats.isDirectory(file)) {

                    createPath(self.dmap, (file.replace(self.root,"")).split(pt.sep).slice(1), {} );
                    self.filesLeft--;
                    self.dirsLeft++;
                    self.walk(file);
                    self.addFile(file, "dir");
                } else {
                    self.filesLeft--;
                    self.addFile(file, self.fileType(file));
                    if (self.filesLeft === 0 && self.dirsLeft === 0) {
                        process.nextTick(function() {
                            self.events.emit("ready");
                        });
                    }
                }
            });
        });
    });
};

FileMap.prototype.search = function(pattern) {
    this.searchPattern = pattern;
    this.walk();
};

FileMap.prototype.isExcludedFile = function(file) {
    if (this.conf.ignores["."]) if (file.match(/\/\./)) return true;
    return this.conf.exclude.some(function(pattern) {
        return file.match(pattern);
    });
};

FileMap.prototype.addFile = function(file, type) {
    if (this.isExcludedFile(file)) return;
    if (this.searchPattern && !file.match(this.searchPattern)) return;
    this.files.push({
        name: file,
        type: type
    });
};

FileMap.prototype.on = function(eventName, fn) {
    this.events.on(eventName, fn);
};

