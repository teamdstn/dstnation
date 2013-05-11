var EventEmitter = require("events").EventEmitter;

Lazer.prototype = new EventEmitter();

module.exports = Lazer;

function Lazer(em, opts) {
    if (!(this instanceof Lazer)) return new Lazer(em, opts);
    var self = this;
    if (em) {
        if (!em._events) em._events = {};
        self._events = em._events;
    }
    self.once = function(name, f) {
        self.on(name, function g() {
            self.removeListener(name, g);
            f.apply(this, arguments);
        });
    };
    if (!opts) opts = {};
    var dataName = opts.data || "data";
    var pipeName = opts.pipe || "pipe";
    var endName = opts.pipe || "end";
    if (pipeName != endName) {
        var piped = false;
        self.once(pipeName, function() {
            piped = true;
        });
        self.once(endName, function() {
            if (!piped) self.emit(pipeName);
        });
    }
    self.push = function(x) {
        self.emit(dataName, x);
    };
    self.end = function() {
        self.emit(endName);
    };
    function newLazer(g, h) {
        if (!g) g = function() {
            return true;
        };
        if (!h) h = function(x) {
            return x;
        };
        var lazer = new Lazer(null, opts);
        self.on(dataName, function(x) {
            if (g.call(lazer, x)) lazer.emit(dataName, h(x));
        });
        self.once(pipeName, function() {
            lazer.emit(pipeName);
        });
        self.once(endName, function() {
            lazer.emit(endName);
        });
        return lazer;
    }
    self.filter = function(f) {
        return newLazer(function(x) {
            return f(x);
        });
    };
    self.forEach = function(f) {
        return newLazer(function(x) {
            f(x);
            return true;
        });
    };
    self.map = function(f) {
        return newLazer(function() {
            return true;
        }, function(x) {
            return f(x);
        });
    };
    self.head = function(f) {
        var lazer = newLazer();
        lazer.on(dataName, function g(x) {
            f(x);
            lazer.removeListener(dataName, g);
        });
    };
    self.tail = function() {
        var skip = true;
        return newLazer(function() {
            if (skip) {
                skip = false;
                return false;
            }
            return true;
        });
    };
    self.skip = function(n) {
        return newLazer(function() {
            if (n > 0) {
                n--;
                return false;
            }
            return true;
        });
    };
    self.take = function(n) {
        return newLazer(function() {
            if (n == 0) self.emit(pipeName);
            return n-- > 0;
        });
    };
    self.takeWhile = function(f) {
        var cond = true;
        return newLazer(function(x) {
            if (cond && f(x)) return true;
            cond = false;
            self.emit(pipeName);
            return false;
        });
    };
    self.foldr = function(op, i, f) {
        var acc = i;
        var lazer = newLazer();
        lazer.on(dataName, function g(x) {
            acc = op(x, acc);
        });
        lazer.once(pipeName, function() {
            f(acc);
        });
    };
    self.sum = function(f) {
        return self.foldr(function(x, acc) {
            return x + acc;
        }, 0, f);
    };
    self.product = function(f) {
        return self.foldr(function(x, acc) {
            return x * acc;
        }, 1, f);
    };
    self.join = function(f) {
        var data = [];
        var lazer = newLazer(function(x) {
            data.push(x);
            return true;
        });
        lazer.once(pipeName, function() {
            f(data);
        });
        return self;
    };
    self.bucket = function(init, f) {
        var lazer = new Lazer(null, opts);
        var yield = function(x) {
            lazer.emit(dataName, x);
        };
        var acc = init;
        self.on(dataName, function(x) {
            acc = f.call(yield, acc, x);
        });
        self.once(pipeName, function() {
            lazer.emit(pipeName);
        });
        self.once(endName, function() {
            var finalBuffer = mergeBuffers(acc);
            if (finalBuffer) yield(finalBuffer);
            lazer.emit(endName);
        });
        return lazer;
    };
    self.__defineGetter__("lines", function() {
        return self.bucket([], function(chunkArray, chunk) {
            var newline = [ "\r".charCodeAt(0), "\n".charCodeAt(0) ], lastNewLineIndex = 0;
            if (typeof chunk === "string") chunk = new Buffer(chunk);
            for (var i = 0; i < chunk.length; i++) {
                if (newline.indexOf(chunk[i]) !== -1) {
                    if (i > 0) {
                        if (i === lastNewLineIndex) {
                            lastNewLineIndex = i - 1;
                        }
                        chunkArray.push(chunk.slice(lastNewLineIndex, i));
                    }
                    if (i + 1 < chunk.length && chunk[i] === newline[0] && chunk[i + 1] === newline[1]) {
                        i++;
                    }
                    this(mergeBuffers(chunkArray));
                    lastNewLineIndex = i + 1;
                }
            }
            if (lastNewLineIndex > 0) {
                if (lastNewLineIndex < chunk.length) chunkArray.push(chunk.slice(lastNewLineIndex));
            } else {
                if (chunk.length) chunkArray.push(chunk);
            }
            return chunkArray;
        });
    });
}

Lazer.range = function() {
    var args = arguments;
    var step = 1;
    var infinite = false;
    if (args.length == 1 && typeof args[0] == "number") {
        var i = 0, j = args[0];
    } else if (args.length == 1 && typeof args[0] == "string") {
        var arg = args[0];
        var startOpen = false, endClosed = false;
        if (arg[0] == "(" || arg[0] == "[") {
            if (arg[0] == "(") startOpen = true;
            arg = arg.slice(1);
        }
        if (arg.slice(-1) == "]") endClosed = true;
        var parts = arg.split("..");
        if (parts.length != 2) throw new Error("single argument range takes 'start..' or 'start..end' or 'start,next..end'");
        if (parts[1] == "") {
            var i = parts[0];
            infinite = true;
        } else {
            var progression = parts[0].split(",");
            if (progression.length == 1) {
                var i = parts[0], j = parts[1];
            } else {
                var i = progression[0], j = parts[1];
                step = Math.abs(progression[1] - i);
            }
        }
        i = parseInt(i, 10);
        j = parseInt(j, 10);
        if (startOpen) {
            if (infinite || i < j) i++; else i--;
        }
        if (endClosed) {
            if (i < j) j++; else j--;
        }
    } else if (args.length == 2 || args.length == 3) {
        var i = args[0], j = args[1];
        if (args.length == 3) {
            var step = args[2];
        }
    } else {
        throw new Error("range takes 1, 2 or 3 arguments");
    }
    var lazer = new Lazer();
    var stopInfinite = false;
    lazer.on("pipe", function() {
        stopInfinite = true;
    });
    if (infinite) {
        process.nextTick(function g() {
            if (stopInfinite) return;
            lazer.emit("data", i++);
            process.nextTick(g);
        });
    } else {
        process.nextTick(function() {
            if (i < j) {
                for (;i < j; i += step) {
                    lazer.emit("data", i);
                }
            } else {
                for (;i > j; i -= step) {
                    lazer.emit("data", i);
                }
            }
            lazer.emit("end");
        });
    }
    return lazer;
};

var mergeBuffers = function mergeBuffers(buffers) {
    if (!buffers || !Array.isArray(buffers) || !buffers.length) return;
    var finalBufferLength, finalBuffer, currentBuffer, currentSize = 0;
    finalBufferLength = buffers.reduce(function(left, right) {
        return (left.length || left) + (right.length || right);
    }, 0);
    finalBuffer = new Buffer(finalBufferLength);
    while (buffers.length) {
        currentBuffer = buffers.shift();
        currentBuffer.copy(finalBuffer, currentSize);
        currentSize += currentBuffer.length;
    }
    return finalBuffer;
};