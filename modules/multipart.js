var fs = require("fs");

exports.defaultBoundary = "48940923NODERESLTER3890457293";

function Stream(stream) {
  if (this._isString(stream)) {
    this.string = "";
  }
  this.stream = stream;
}

Stream.prototype = {
  write: function(data) {
    if (this.string != undefined) {
      this.string += data;
    } else {
      this.stream.write(data, "binary");
    }
  },
  _isString: function(obj) {
    return !!(obj === "" || obj && obj.charCodeAt && obj.substr);
  }
};

function File(path, filename, fileSize, encoding, contentType) {
  this.path = path;
  this.filename = filename || this._basename(path);
  this.fileSize = fileSize;
  this.encoding = encoding || "binary";
  this.contentType = contentType || "application/octet-stream";
}

File.prototype = {
  _basename: function(path) {
    var parts = path.split(/\/|\\/);
    return parts[parts.length - 1];
  }
};

function Data(filename, contentType, data) {
  this.filename = filename;
  this.contentType = contentType || "application/octet-stream";
  this.data = data;
}

function Part(name, value, boundary) {
  this.name = name;
  this.value = value;
  this.boundary = boundary;
}

Part.prototype = {
  header: function() {
    var header;
    if (this.value.data) {
      header = 'Content-Disposition: form-data; name="' + this.name + '"; filename="' + this.value.filename + '"\r\n' + "Content-Type: " + this.value.contentType;
    }
    if (this.value instanceof File) {
      header = 'Content-Disposition: form-data; name="' + this.name + '"; filename="' + this.value.filename + '"\r\n' + "Content-Length: " + this.value.fileSize + "\r\n" + "Content-Type: " + this.value.contentType;
    } else {
      header = 'Content-Disposition: form-data; name="' + this.name + '"';
    }
    return "--" + this.boundary + "\r\n" + header + "\r\n\r\n";
  },
  sizeOf: function() {
    var valueSize;
    if (this.value instanceof File) {
      valueSize = this.value.fileSize;
    } else if (this.value.data) {
      valueSize = this.value.data.length;
    } else if (typeof this.value === "number") {
      valueSize = this.value.toString().length;
    } else {
      valueSize = this.value.length;
    }
    return valueSize + this.header().length + 2;
  },
  write: function(stream, callback) {
    var self = this;
    stream.write(this.header());
    if (this.value instanceof File) {
      fs.open(this.value.path, "r", 438, function(err, fd) {
        if (err) throw err;
        var position = 0;
        (function reader() {
          fs.read(fd, 1024 * 4, position, "binary", function(er, chunk) {
            if (er) callback(err);
            stream.write(chunk);
            position += 1024 * 4;
            if (chunk) reader(); else {
              stream.write("\r\n");
              callback();
              fs.close(fd);
            }
          });
        })();
      });
    } else {
      stream.write(this.value + "\r\n");
      callback();
    }
  }
};

function MultiPartRequest(data, boundary) {
  this.encoding = "binary";
  this.boundary = boundary || exports.defaultBoundary;
  this.data = data;
  this.partNames = this._partNames();
}

MultiPartRequest.prototype = {
  _partNames: function() {
    var partNames = [];
    for (var name in this.data) {
      partNames.push(name);
    }
    return partNames;
  },
  write: function(stream, callback) {
    var partCount = 0, self = this;
    var stream = new Stream(stream);
    (function writePart() {
      var partName = self.partNames[partCount];
      var part = new Part(partName, self.data[partName], self.boundary);
      part.write(stream, function(err) {
        if (err) {
          callback(err);
          return;
        }
        partCount += 1;
        if (partCount < self.partNames.length) writePart(); else {
          stream.write("--" + self.boundary + "--" + "\r\n");
          if (callback) callback(stream.string || "");
        }
      });
    })();
  }
};

var exportMethods = {
  file: function(path, filename, fileSize, encoding, contentType) {
    return new File(path, filename, fileSize, encoding, contentType);
  },
  data: function(filename, contentType, data) {
    return new Data(filename, contentType, data);
  },
  sizeOf: function(parts, boundary) {
    var totalSize = 0;
    boundary = boundary || exports.defaultBoundary;
    for (var name in parts) totalSize += new Part(name, parts[name], boundary).sizeOf();
    return totalSize + boundary.length + 6;
  },
  write: function(stream, data, callback, boundary) {
    var r = new MultiPartRequest(data, boundary);
    r.write(stream, callback);
    return r;
  }
};

Object.keys(exportMethods).forEach(function(exportMethod) {
  exports[exportMethod] = exportMethods[exportMethod];
});