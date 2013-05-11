//[DEPENDENCE] : ━━━━━━━━━━━━━━━━━
var fs          = require("fs")
  , formats     = require("../formats")
  , Memory      = require("./memory").Memory
  , exists      = fs.exists
  , existsSync  = fs.existsSync
  , inherits    = function(ctor,stor){ctor.super_=stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})};
  ;//━━━━━━━━━━━━━━━━━━━━━━━━

var File = exports.File = function(options) {
    if (!options || !options.file) {
        throw new Error("Missing required option `file`");
    }
    Memory.call(this, options);
    this.type = "file";
    this.file = options.file;
    this.dir = options.dir || process.cwd();
    this.format = options.format || formats.json;
    this.json_spacing = options.json_spacing || 2;
    if (options.search) {
        this.search(this.dir);
    }
};

inherits(File, Memory);

File.prototype.save = function(value, cb) {
    //if (!callback) { callback = value, value = null;}
    fs.writeFile(this.file, this.format.stringify(this.store, null, this.json_spacing), function(err) {
      return cb ? cb(err||null) : value;
      //return err ? callback(err) : callback();
    });
};

File.prototype.saveSync = function(value) {
    try {
        fs.writeFileSync(this.file, this.format.stringify(this.store, null, this.json_spacing));
    } catch (ex) {
        throw ex;
    }
    return this.store;
};

File.prototype.load = function(callback) {
    var self = this;
    exists(self.file, function(exists) {
        if (!exists) {
            return callback(null, {});
        }
        fs.readFile(self.file, function(err, data) {
            if (err) {
                return callback(err);
            }
            try {
                self.store = self.format.parse(data.toString());
            } catch (ex) {
                return callback(new Error("Error parsing your JSON configuration file."));
            }
            callback(null, self.store);
        });
    });
};

File.prototype.loadSync = function() {
    var data, self = this;
    if (!existsSync(self.file)) {
        self.store = {};
        data = {};
    } else {
        try {
            data = this.format.parse(fs.readFileSync(this.file, "utf8"));
            this.store = data;
        } catch (ex) {
            throw new Error("Error parsing your JSON configuration file.");
        }
    }
    return data;
};

File.prototype.search = function(base) {
    var looking = true, fullpath, previous, stats;
    base = base || process.cwd();
    if (this.file[0] === "/") {
        try {
            stats = fs.statSync(fs.realpathSync(this.file));
            if (stats.isFile()) {
                fullpath = this.file;
                looking = false;
            }
        } catch (ex) {}
    }
    if (looking && base) {
        try {
            var stat = fs.statSync(fs.realpathSync(base));
            looking = stat.isDirectory();
        } catch (ex) {
            return false;
        }
    }
    while (looking) {
        try {
            stats = fs.statSync(fs.realpathSync(fullpath = path.join(base, this.file)));
            looking = stats.isDirectory();
        } catch (ex) {
            previous = base;
            base = path.dirname(base);
            if (previous === base) {
                try {
                    stats = fs.statSync(fs.realpathSync(fullpath = path.join(this.dir, this.file)));
                    if (stats.isDirectory()) {
                        fullpath = undefined;
                    }
                } catch (ex) {}
                looking = false;
            }
        }
    }
    this.file = fullpath || this.file;
    return fullpath;
};