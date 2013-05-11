//[] :____________________
var fs            = require("fs")
  , pt            = require("path")
  , constants     = require("./../../constants")
  , queue = []
;//_________________________________
function noop() {}
;//_________________________________
exports = module.exports = fs;
fs._curOpen       = 0;
fs.MIN_MAX_OPEN   = 64;
fs.MAX_OPEN       = 1024;
fs.EMFILE_MAX     = 1e3;
fs.BUSYTRIES_MAX  = 3;
//[] :____________________
var __open      = fs.open
  , __close     = fs.close
  , __openSync  = fs.openSync
  , __closeSync = fs.closeSync
  , __timeout   = 0
  , lstat
  , lstatSync
;//_________________________________


function OpenReq(path, flags, mode, cb) {
  this.path   = path;
  this.flags  = flags;
  this.mode   = mode;
  this.cb     = cb;
}

if (process.platform === "win32") {
  var v = process.version.replace(/^v/, "").split(/\.|-/).map(Number);
  if (v[0] === 0 && (v[1] < 7 || v[1] == 7 && v[2] < 9)) {
    lstat = "stat";
  }
}
!fs[lstat] && (lstat = "stat");
lstatSync = lstat+"Sync";

fs.open = gracefulOpen;
fs.existsThen  = existsThen;

function existsThen(fl, str, cb) {
  typeof str  === "function" && ((cb = str),(str = null));
  Array.isArray(fl) && (fl = pt.join.apply(pt.join, fl));
  fs.exists(fl, function(exist) {
    if(str !== void 0 && !exist){
      mkdirP(str === false ? fl : pt.dirname(fl), function(err){
        if(str === false) return cb ? cb(exist, fl) : exist;
        str === Object(str) && (str = JSON.stringify(str, null, 2))
        fs.writeFile(fl, str === true ? "" : str, "utf-8", function(err){
          return cb ? cb(exist, fl) : exist;
        })

      })
    }else{
      return cb ? cb(exist, fl) : exist;
    }
  });
}

function gracefulOpen(path, flags, mode, cb) {
    if (typeof mode === "function") cb = mode, mode = null;
    if (typeof cb !== "function") cb = noop;
    if (fs._curOpen >= fs.MAX_OPEN) {
        queue.push(new OpenReq(path, flags, mode, cb));
        setTimeout(flush);
        return;
    }
    open(path, flags, mode, function(er, fd) {
        if (er && er.code === "EMFILE" && fs._curOpen > fs.MIN_MAX_OPEN) {
            fs.MAX_OPEN = fs._curOpen - 1;
            return fs.open(path, flags, mode, cb);
        }
        cb(er, fd);
    });
}

function open(path, flags, mode, cb) {
    cb = cb || noop;
    fs._curOpen++;
    __open.call(fs, path, flags, mode, function(er, fd) {
        if (er) onclose();
        cb(er, fd);
    });
}

fs.openSync = function(path, flags, mode) {
    var ret;
    try {
        ret = __openSync.call(fs, path, flags, mode);
        fs._curOpen++;
    } finally {}
    return ret;
};

function onclose() {
    fs._curOpen--;
    flush();
}

function flush() {
    while (fs._curOpen < fs.MAX_OPEN) {
        var req = queue.shift();
        if (!req) return;
        open(req.path, req.flags || "r", req.mode || 511, req.cb);
    }
}

fs.close = function(fd, cb) {
    cb = cb || noop;
    __close.call(fs, fd, function(er) {
        onclose();
        cb(er);
    });
};

fs.closeSync = function(fd) {
    onclose();
    return __closeSync.call(fs, fd);
};

if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    fs.lchmod = function(path, mode, callback) {
        callback = callback || noop;
        fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(err, fd) {
            if (err) {
                callback(err);
                return;
            }
            fs.fchmod(fd, mode, function(err) {
                fs.close(fd, function(err2) {
                    callback(err || err2);
                });
            });
        });
    };
    fs.lchmodSync = function(path, mode) {
        var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
        var err, err2;
        try {
            var ret = fs.fchmodSync(fd, mode);
        } catch (er) {
            err = er;
        }
        try {
            fs.closeSync(fd);
        } catch (er) {
            err2 = er;
        }
        if (err || err2) throw err || err2;
        return ret;
    };
}

if (!fs.lutimes) {
    if (constants.hasOwnProperty("O_SYMLINK")) {
        fs.lutimes = function(path, at, mt, cb) {
            fs.open(path, constants.O_SYMLINK, function(er, fd) {
                cb = cb || noop;
                if (er) return cb(er);
                fs.futimes(fd, at, mt, function(er) {
                    fs.close(fd, function(er2) {
                        return cb(er || er2);
                    });
                });
            });
        };
        fs.lutimesSync = function(path, at, mt) {
            var fd = fs.openSync(path, constants.O_SYMLINK), err, err2, ret;
            try {
                ret = fs.futimesSync(fd, at, mt);
            } catch (er) {
                err = er;
            }
            try {
                fs.closeSync(fd);
            } catch (er) {
                err2 = er;
            }
            if (err || err2) throw err || err2;
            return ret;
        };
    } else if (fs.utimensat && constants.hasOwnProperty("AT_SYMLINK_NOFOLLOW")) {
        fs.lutimes = function(path, at, mt, cb) {
            fs.utimensat(path, at, mt, constants.AT_SYMLINK_NOFOLLOW, cb);
        };
        fs.lutimesSync = function(path, at, mt) {
            return fs.utimensatSync(path, at, mt, constants.AT_SYMLINK_NOFOLLOW);
        };
    } else {
        fs.lutimes = function(_a, _b, _c, cb) {
            process.nextTick(cb);
        };
        fs.lutimesSync = function() {};
    }
}

fs.chown = chownFix(fs.chown);

fs.fchown = chownFix(fs.fchown);

fs.lchown = chownFix(fs.lchown);

fs.chownSync = chownFixSync(fs.chownSync);

fs.fchownSync = chownFixSync(fs.fchownSync);

fs.lchownSync = chownFixSync(fs.lchownSync);

function chownFix(orig) {
    if (!orig) return orig;
    return function(target, uid, gid, cb) {
        return orig.call(fs, target, uid, gid, function(er, res) {
            if (chownErOk(er)) er = null;
            cb(er, res);
        });
    };
}

function chownFixSync(orig) {
    if (!orig) return orig;
    return function(target, uid, gid) {
        try {
            return orig.call(fs, target, uid, gid);
        } catch (er) {
            if (!chownErOk(er)) throw er;
        }
    };
}

function chownErOk(er) {
    if (!er || (!process.getuid || process.getuid() !== 0) && (er.code === "EINVAL" || er.code === "EPERM")) return true;
}

if (!fs.lchmod) {
    fs.lchmod = function(path, mode, cb) {
        process.nextTick(cb);
    };
    fs.lchmodSync = function() {};
}

if (!fs.lchown) {
    fs.lchown = function(path, uid, gid, cb) {
        process.nextTick(cb);
    };
    fs.lchownSync = function() {};
}

if (process.platform === "win32") {
    var rename_ = fs.rename;
    fs.rename = function rename(from, to, cb) {
        var start = Date.now();
        rename_(from, to, function CB(er) {
            if (er && (er.code === "EACCES" || er.code === "EPERM") && Date.now() - start < 1e3) {
                return rename_(from, to, CB);
            }
            cb(er);
        });
    };
}

var mkdirP = function mkdirP(p, mode, f, made) {
    if (typeof mode === "function" || mode === undefined) {
        f = mode;
        mode = 511 & ~process.umask();
    }
    if (!made) made = null;
    var cb = f || function() {};
    if (typeof mode === "string") mode = parseInt(mode, 8);
    p = pt.resolve(p);
    fs.mkdir(p, mode, function(er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
          case "ENOENT":
            mkdirP(pt.dirname(p), mode, function(er, made) {
                if (er) cb(er, made); else mkdirP(p, mode, cb, made);
            });
            break;

          case "EISDIR":
          case "EPERM":
          case "EROFS":
          case "EEXIST":
            fs.stat(p, function(er2, stat) {
                if (er2 || !stat.isDirectory()) cb(er, made); else cb(null, made);
            });
            break;

          default:
            cb(er, made);
            break;
        }
    });
};

mkdirP.w = function(fl, txt, force, cb) {
    Array.isArray(fl) && (fl = pt.join(fl[0], fl[1]));
    "function" == typeof force && (cb = force, force = false);
    mkdirP(pt.dirname(fl), function(err) {
        fs.writeFile(fl, txt, function(err) {
            return cb ? cb(err, txt) : txt;
        });
    });
};

mkdirP.ws = function(fl, force, cb) {
    Array.isArray(fl) && (fl = pt.join(fl[0], fl[1]));
    "function" == typeof force && (cb = force, force = false);
    mkdirP(pt.dirname(fl), function(err) {
        var _ws = fs.WriteStream(fl);
        _ws.del = function(cb) {
            _ws.end();
            _ws.destroy();
            return rimraf(fl, cb || function() {
                return;
            });
        };
        return cb ? cb(err, _ws) : _ws;
    });
};

mkdirP.sync = function sync(p, mode, made) {
    if (mode === undefined) {
        mode = 511 & ~process.umask();
    }
    if (!made) made = null;
    if (typeof mode === "string") mode = parseInt(mode, 8);
    p = pt.resolve(p);
    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    } catch (err0) {
        switch (err0.code) {
          case "ENOENT":
            made = sync(pt.dirname(p), mode, made);
            sync(p, mode, made);
            break;

          case "EEXIST":
            var stat;
            try {
                stat = fs.statSync(p);
            } catch (err1) {
                throw err0;
            }
            if (!stat.isDirectory()) throw err0;
            break;

          default:
            throw err0;
            break;
        }
    }
    return made;
};

function rimraf(p, cb) {
    if (!cb) return console.error("No callback passed to rimraf()");
    var busyTries = 0;
    rimraf_(p, function CB(er) {
        if (er) {
            if (er.code === "EBUSY" && busyTries < exports.BUSYTRIES_MAX) {
                busyTries++;
                var time = busyTries * 100;
                return setTimeout(function() {
                    rimraf_(p, CB);
                }, time);
            }
            if (er.code === "EMFILE" && __timeout < exports.EMFILE_MAX) {
                return setTimeout(function() {
                    rimraf_(p, CB);
                }, __timeout++);
            }
            if (er.code === "ENOENT") er = null;
        }
        __timeout = 0;
        cb(er);
    });
}

function rimraf_(p, cb) {
    fs[lstat](p, function(er, s) {
        if (er) {
            if (er.code === "ENOENT") return cb();
            return cb(er);
        }
        return rm_(p, s, false, cb);
    });
}

var myGid = function myGid() {
    var g = process.getuid && process.getgid();
    myGid = function myGid() {
        return g;
    };
    return g;
};

var myUid = function myUid() {
    var u = process.getuid && process.getuid();
    myUid = function myUid() {
        return u;
    };
    return u;
};

function writable(s) {
    var mode = s.mode || 511, uid = myUid(), gid = myGid();
    return mode & 2 || gid === s.gid && mode & 16 || uid === s.uid && mode & 128;
}

function rm_(p, s, didWritableCheck, cb) {
    if (!didWritableCheck && !writable(s)) {
        return fs.chmod(p, s.mode | 146, function(er) {
            if (er) return cb(er);
            rm_(p, s, true, cb);
        });
    }
    if (!s.isDirectory()) {
        return fs.unlink(p, cb);
    }
    fs.readdir(p, function(er, files) {
        if (er) return cb(er);
        asyncForEach(files.map(function(f) {
            return pt.join(p, f);
        }), function(file, cb) {
            rimraf(file, cb);
        }, function(er) {
            if (er) return cb(er);
            fs.rmdir(p, cb);
        });
    });
}

function asyncForEach(list, fn, cb) {
    if (!list.length) cb();
    var c = list.length, errState = null;
    list.forEach(function(item, i, list) {
        fn(item, function(er) {
            if (errState) return;
            if (er) return cb(errState = er);
            if (--c === 0) return cb();
        });
    });
}

function rimrafSync(p) {
    try {
        var s = fs[lstatSync](p);
    } catch (er) {
        if (er.code === "ENOENT") return;
        throw er;
    }
    if (!writable(s)) {
        fs.chmodSync(p, s.mode | 146);
    }
    if (!s.isDirectory()) return fs.unlinkSync(p);
    fs.readdirSync(p).forEach(function(f) {
        rimrafSync(pt.join(p, f));
    });
    fs.rmdirSync(p);
}

fs.mkdirp   = mkdirP;
fs.rm       = rimraf;
fs.rmSync   = rimrafSync;
fs.graceful = true;

exports.__defineGetter__("fmap", function(){ return require("./fmap"); });