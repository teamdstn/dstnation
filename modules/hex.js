var Buffer = require("buffer").Buffer;
require("bufferjs");
exports.Buffer = Buffer;
Buffer.prototype.scan = function(chunksize, each, end) {
    var end = end || function() {};
    var each = each || function() {};
    var maxi = this.length;
    var items = 0;
    if (maxi % chunksize === 0) {
        items = maxi / chunksize;
    }
    var indexat = 0;
    var self = this;
    var count = 0;
    function chunk() {
        var pp = indexat + chunksize;
        pp = pp > maxi ? maxi : pp;
        each.apply(each, [ self.slice(indexat, pp), count ]);
        count++;
        if (indexat < self.length - chunksize) {
            indexat += chunksize;
            process.nextTick(chunk);
        } else {
            end.apply(end, [ count ]);
        }
    }
    chunk();
};
Buffer.prototype.extract = function(obj) {
    var o = {};
    for (var prop in obj) {
        if (obj[prop].pos) {
            o[prop] = obj[prop].type(this.slice(obj[prop].pos[0], obj[prop].pos[1]));
        } else {
            if (typeof obj[prop] === "object") {
                o[prop] = {};
                for (var subprop in obj[prop]) {
                    if (obj[prop][subprop].pos) {
                        o[prop][subprop] = obj[prop][subprop].type(this.slice(obj[prop][subprop].pos[0], obj[prop][subprop].pos[1]));
                    }
                }
            }
        }
    }
    return o;
};
Buffer.prototype.clone = function() {
    return this.slice(0);
};
Buffer.prototype.XOR = function(buf) {
    var nn = new Buffer(this.length);
    var mi = buf.length;
    var fi = 0;
    var n = this.length;
    for (var i = 0; i < n; i++) {
        if (i > mi) {
            fi = 0;
        }
        nn[i] = this[i] ^ buf[fi];
        fi++;
    }
    return nn;
};
Buffer.prototype.append = function(buf) {
    var tmp = new Buffer(this.length + buf.length);
    for (var i = 0; i < this.length; i++) {
        tmp[i] = this[i];
    }
    for (var i = 0; i < buf.length; i++) {
        tmp[this.length + i] = buf[i];
    }
    return tmp;
};
var crypto = require("crypto");
Buffer.prototype.chksum = function(encoding) {
    var encoding = encoding || "base64";
    var hash = crypto.createHash("sha256");
    hash.update(this);
    var r = hash.digest(encoding);
    if (encoding === "binary") {
        var rr = new Buffer(32);
        for (var i = 0; i < 32; i++) {
            rr[i] = r.charCodeAt(i);
        }
        r = rr;
    }
    return r;
};
Buffer.prototype.chksuma = function(encoding) {
    var encoding = encoding | "base64";
    var hash = crypto.createHash("sha1");
    hash.update(this);
    return hash.digest(encoding);
};
Buffer.prototype.toHex = function() {
    var s = "";
    for (var i = 0; i < this.length; i++) {
        var byte = this[i].toString(16);
        byte = byte.length < 2 ? "0" + byte : byte;
        s += byte;
    }
    return s;
};
Buffer.prototype.toInt = function() {
    var l = this.length - 1;
    var i = this[l];
    l--;
    var b = 256;
    while (l > -1) {
        i += this[l] * b;
        l--;
        b *= 256;
    }
    return i;
};
Buffer.prototype.cmpSame = function(cmp) {
    return !this.cmpNotSame.apply(this, [ cmp ]);
};
Buffer.prototype.cmpNotSame = function(cmp) {
    var f = false;
    var nmax = this.length > cmp.length ? cmp.length : this.length;
    var n = 0;
    while (!f) {
        if (cmp[n] === this[n]) {
            n++;
        } else {
            f = true;
        }
        if (n > nmax) {
            return f;
        }
    }
    return f;
};
exports.dump = hexdump;
Buffer.prototype.indexOf = function(bytes, start) {
    var i = start || 0;
    var len = this.length - bytes.length, found = false;
    while (!found && i < len) {
        var a = this.slice(i, i + bytes.length);
        if (a.toString() === bytes.toString()) {
            return i;
        }
        i++;
    }
    return false;
};
Buffer.prototype.fill = function(a) {
    if (typeof a === "function") {
        for (var i = 0; i < this.length; i++) {
            this[i] = a.apply(this, [ i ]);
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            this[i] = a;
        }
    }
};
Buffer.prototype.filla = function(a, ii, is) {
    if (typeof a === "function") {
        for (var i = ii; i < is; i++) {
            this[i] = a.apply(this, [ i ]);
        }
    } else {
        for (var i = ii; i < is; i++) {
            this[i] = a;
        }
    }
};
function random_byte() {
    return Math.floor(Math.random() * 255);
}
function add_byte(i) {
    this[i] = this[i] + 1;
}
function hexdump(buf, showascii, perline, space, padit, linenums, showtype) {
    var showtype = showtype || false;
    var s = "";
    if (showtype) {
        s += "type: " + typeof buf + " " + (buf instanceof Buffer) + "\n";
    }
    if (typeof buf !== "object") {
        buf = new Buffer(buf);
    }
    var usebuf;
    var perline = perline === 0 || perline ? perline : 32;
    var space = space === 0 || space ? space : 8;
    var showascii = showascii || false;
    var linenums = linenums || false;
    if (perline === 0) {
        perline = buf.length;
    }
    usebuf = buf;
    if (padit) {
        var shouldbelength = Math.ceil(buf.length / perline) * perline;
        var nbuf = new Buffer(shouldbelength);
        nbuf.fill(0);
        buf.copy(nbuf, 0, 0, buf.length);
        usebuf = nbuf;
    }
    var tl = Math.ceil(buf.length / perline);
    for (var i = 0; i < tl; i++) {
        var mx = i * perline + perline;
        if (mx > usebuf.length) {
            mx = usebuf.length;
        }
        if (linenums) {
            s += intToHex(i * perline, 3) + " ";
        }
        var a = "";
        var t = usebuf.slice(i * perline, mx);
        for (var y = 0; y < t.length; y++) {
            s += int2hex(t[y]);
            if (t[y] > 31 && t[y] !== 127) {
                a += String.fromCharCode(t[y]);
            } else {
                a += ".";
            }
            if (y % space === space - 1) {
                s += " ";
                a += " ";
            }
        }
        if (showascii) {
            s += " | " + a;
        }
        if (tl > 1) {
            s += "\n";
        }
    }
    return s;
}
function int2hex(integer) {
    integer = integer.toString(16);
    if (integer.length % 2 !== 0) {
        integer = "0" + integer;
    }
    return integer;
}
function int2word(integer) {
    integer = integer.toString(16);
    if (integer.length % 8 !== 0) {
        while (integer.length < 8) {
            integer = "0" + integer;
        }
    }
    return integer;
}
function int2longword(integer) {
    integer = integer.toString(16);
    if (integer.length % 16 !== 0) {
        while (integer.length < 16) {
            integer = "0" + integer;
        }
    }
    return integer;
}
exports.intToHex = intToHex;
exports.hexToBytes = hexToBytes;
exports.hexToBuffer = hexToBuffer;
function hexToBuffer(hexa) {
    return new Buffer(hexToBytes(hexa));
}
function hexToBytes(hexa) {
    for (var bytes = [], c = 0; c < hexa.length / 2; c++) bytes.push(parseInt(hexa.substr(c * 2, 2), 16));
    return bytes;
}
function intToHex(integera, bytes) {
    var bytes = bytes || 1;
    integera = integera.toString(16);
    if (integera.length % (bytes * 2) !== 0) {
        while (integera.length < bytes * 2) {
            integera = "0" + integera;
        }
    }
    return integera;
}
exports.bufferToInt = function(arr) {
    var l = arr.length - 1;
    var i = arr[l];
    l--;
    var b = 256;
    while (l > -1) {
        i += arr[l] * b;
        l--;
        b *= 256;
    }
    return i;
};
exports.intToBuffer = function(integer, bytesa) {
    var hex = intToHex(integer, bytesa);
    var bb = hexToBytes(hex);
    return new Buffer(bb);
};
String.prototype.lpad = function(l, ww) {
    var w = ww || " ";
    var s = this;
    while (s.length < l) {
        s = w + s;
    }
    return s;
};
String.prototype.rpad = function(l, ww) {
    var w = ww || " ";
    var s = this;
    while (s.length < l) {
        s = s + w;
    }
    return s;
};