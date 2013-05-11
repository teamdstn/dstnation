var sys       = require('util');
var http      = require('http');
var https     = require('https');
var url       = require('url');
var qs        = require('querystring');
var form      = require('./multipart');
var zlib      = null;
var Iconv     = null;
var stream    = require("stream");
var mime      = require("mime");
try {
  zlib = require('zlib');
} catch (err) {}

try {
  Iconv = require('iconv').Iconv;
} catch (err) {}

function mixin(target, source) {
  source = source || {};
  Object.keys(source).forEach(function(key) {
    target[key] = source[key];
  });

  return target;
}
function inherits(ctor,stor){ctor.super_ = stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}
function isReadStream(rs) { return rs.readable && rs.path && rs.mode; }
function Request(uri, options) {
  var self = this;
  this.url = url.parse(uri);
  this.options = options;
  this.headers = {
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4',
    'Host': this.url.host
  };

  if (zlib) {
    this.headers['Accept-Encoding'] = 'gzip, deflate';
  }

  mixin(this.headers, options.headers || {});

  // set port and method defaults
  if (!this.url.port) this.url.port = (this.url.protocol == 'https:') ? '443' : '80';
  if (!this.options.method) this.options.method = (this.options.data) ? 'POST' : 'GET';
  if (typeof this.options.followRedirects == 'undefined') this.options.followRedirects = true;

  // stringify query given in options of not given in URL
  if (this.options.query && !this.url.query) {
    if (typeof this.options.query == 'object')
      this.url.query = qs.stringify(this.options.query);
    else this.url.query = this.options.query;
  }

  this._applyBasicAuth();

  if (this.options.form) {
    this.options.data = this.options.form;

    this.headers['Content-Type'] = 'multipart/form-data; boundary=' + form.defaultBoundary;
    var form_size = form.sizeOf(this.options.data, form.defaultBoundary);
    if (typeof form_size === 'number' && form_size === form_size) {
        this.headers['Content-Length'] = form_size;
    }
    else {
        console.log("Building multipart request without Content-Length header, please specify all file sizes");
    }
  } else {
    if (typeof this.options.data == 'object') {
      this.options.data = qs.stringify(this.options.data);
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      this.headers['Content-Length'] = this.options.data.length;
    }
    if(typeof this.options.data == 'string') {
      var buffer = new Buffer(this.options.data, this.options.encoding || 'utf8');
      this.options.data = buffer;
      this.headers['Content-Length'] = buffer.length;
    }
  }

  var proto = (this.url.protocol == 'https:') ? https : http;

  this.request = proto.request({
    host:     this.url.hostname,
    port:     this.url.port,
    path:     this._fullPath(),
    method:   this.options.method,
    headers: this.headers
  });

  this._makeRequest();
}
inherits(Request, stream.Stream);

Request.prototype = new process.EventEmitter();

mixin(Request.prototype, {
  _isRedirect: function(response) {
    return ([301, 302, 303].indexOf(response.statusCode) >= 0);
  },
  _fullPath: function() {
    var path = this.url.pathname || '/';
    if (this.url.hash) path += this.url.hash;
    if (this.url.query) path += '?' + this.url.query;
    return path;
  },
  _applyBasicAuth: function() {
    var authParts;

    if (this.url.auth) {
      authParts = this.url.auth.split(':');
      this.options.username = authParts[0];
      this.options.password = authParts[1];
    }

    if (this.options.username && this.options.password) {
      var b = new Buffer([this.options.username, this.options.password].join(':'));
      this.headers['Authorization'] = "Basic " + b.toString('base64');
    }
  },
  _responseHandler: function(response) {
    var self = this;

    response.headers['location'] && (self.emit('reloc', response));
    if (self._isRedirect(response) && self.options.followRedirects) {
      try {
        self.url = url.parse(url.resolve(self.url.href, response.headers['location']));
        self._retry();
        // todo handle somehow infinite redirects
      } catch(err) {
        err.message = 'Failed to follow redirect: ' + err.message;
        self._fireError(err, response);
      }
    } else {
      var body = '';

      self.dests.forEach(function(dest) {
        self.pipeDest(dest, response);
      });


      if(self.pipe){
        response.on('data', function(chunk) {
          self.emit('data', chunk);
          body += chunk;
        });
        response.on('end', function() {
          self.callback && (self.callback(null, null, null));
        });

      }else{
       response.setEncoding('binary');

        response.on('data', function(chunk) {
          self.emit('data', chunk);
          body += chunk;
        });

        response.on('end', function() {
          response.rawEncoded = body;
          self._decode(new Buffer(body, 'binary'), response, function(err, body) {
            if (err) {

              console.log(err)
              self._fireError(err, response);
              self.callback && (self.callback(err, response));
              return;
            }
            response.raw = body;



            body = self._iconv(body, response);
            self._encode(body, response, function(err, body) {
              if (err) {
                self._fireError(err, response);
              } else {
                self._fireSuccess(body, response);
                self.callback && (self.callback(null, response, body));
              }
            });
          });
        });
      }
    }
  },
  setHeader : function(name, value, clobber) {
      clobber === void 0 && (clobber = true);
      this.headers[name] = clobber || !this.headers.hasOwnProperty(name) ? value : this.headers[name] += "," + value;
      return this;
  },
  setHeaders : function(headers) {
      for (var i in headers) {
          this.setHeader(i, headers[i]);
      }
      return this;
  },
  pipeDest : function(dest, res) {
      var response = res;
      if (dest.headers) {
          dest.headers["content-type"] = response.headers["content-type"];
          if (response.headers["content-length"]) {
              dest.headers["content-length"] = response.headers["content-length"];
          }
      }
      if (dest.setHeader) {
          var flag = false;
          for (var i in response.headers){
            //response.headers[i] === "gzip" && (flag = true);
            //if(!(flag && i === "content-type"))
            dest.setHeader(i, response.headers[i]);
          }
          dest.statusCode = response.statusCode;
      }
      if (this.pipefilter)
        this.pipefilter(response, dest);
      return this;
  },
  _decode: function(body, response, callback) {
    var decoder = response.headers['content-encoding'];
    if (decoder in decoders) {
      decoders[decoder].call(response, body, callback);
    } else {
      callback(null, body);
    }
  },
  _iconv: function(body, response) {
    if (Iconv) {
      var charset = response.headers['content-type'];
      if (charset) {
        charset = /\bcharset=(.+)(?:;|$)/i.exec(charset);
        if (charset) {
          charset = charset[1].trim().toUpperCase();
          if (charset != 'UTF-8') {
            try {
              var iconv = new Iconv(charset, 'UTF-8//TRANSLIT//IGNORE');
              return iconv.convert(body);
            } catch (err) {}
          }
        }
      }
    }
    return body;
  },
  _encode: function(body, response, callback) {
    var self = this;
    if (self.options.decoding == 'buffer') {
      callback(null, body);
    } else {
      body = body.toString(self.options.decoding);
      if (self.options.parser) {
        self.options.parser.call(response, body, callback);
      } else {
        callback(null, body);
      }
    }
  },
  _fireError: function(err, response) {
    this.emit('error',    err, response);
    this.emit('complete', err, response);
    this.emit('end', err, response);
  },
  _fireSuccess: function(body, response) {
    if (parseInt(response.statusCode) >= 400) {
      this.emit('fail', body, response);
    } else {
      this.emit('success', body, response);
    }
    this.emit(response.statusCode.toString().replace(/\d{2}$/, 'XX'), body, response);
    this.emit(response.statusCode.toString(), body, response);
    this.emit('complete', body, response);
    this.emit('end', body, response);
  },
  _makeRequest: function() {
    var self = this;
    this.request.on('response', function(response) {
      self.emit('response', response);
      self._responseHandler(response);
    }).on('error', function(err) {
      if (!self.aborted) {
        self._fireError(err, null);
      }
    });
  },
  _retry: function() {
    this.request.removeAllListeners().on('error', function() {});
    if (this.request.finished) {
      this.request.abort();
    }
    Request.call(this, this.url.href, this.options); // reusing request object to handle recursive calls and remember listeners
    this.run();
  },
  run: function() {
    var self = this;
    self.walk = true;
    if (this.options.form) {
      form.write(this.request, this.options.data, function() {
        self.request.end();
      });
    } else {
      if (this.options.data) {
        this.request.write(this.options.data.toString(), this.options.encoding || 'utf8');
      }
      this.request.end();
    }

    return this;
  },
  abort: function(err) {
    var self = this;

    if (err) {
      if (typeof err == 'string') {
        err = new Error(err);
      } else if (!(err instanceof Error)) {
        err = new Error('AbortError');
      }
      err.type = 'abort';
    } else {
      err = null;
    }

    self.request.on('close', function() {
      if (err) {
        self._fireError(err, null);
      } else {
        self.emit('complete', null, null);
      }
    });

    self.aborted = true;
    self.request.abort();
    self.emit('abort', err);
    return this;
  },
  retry: function(timeout) {
    var self = this;
    timeout = parseInt(timeout);
    var fn = self._retry.bind(self);
    if (!isFinite(timeout) || timeout <= 0) {
      process.nextTick(fn, timeout);
    } else {
      setTimeout(fn, timeout);
    }
    return this;
  },
  end: function(){
    if(this.callback){
      return this.on("end", this.callback);
    }
    return this;
  }
});

function shortcutOptions(options, method) {
  options = options || {};
  options.method = method;
  options.parser = (typeof options.parser !== "undefined") ? options.parser : parsers.auto;
  return options;
}

function request(url, options, cb) {
  var request = new Request(url, options);
  request.dests = [];
  request.pipe  = __pipe;
  request.form  = __form;
  request.callback  = cb;
  request.on('error', function() {});
  process.nextTick(request.run.bind(request));
 	return request;
}



function get(url, options, cb) {
  "function" == typeof options && ((cb = options),(options = null));
  return request(url, shortcutOptions(options, 'GET'), cb);
}

function patch(url, options, cb) {
  "function" == typeof options && ((cb = options),(options = null));
  return request(url, shortcutOptions(options, 'PATCH'), cb);
}

function post(url, options, cb) {
  "function" == typeof options && ((cb = options),(options = null));
  return request(url, shortcutOptions(options, 'POST'), cb);
}

function put(url, options, cb) {
  "function" == typeof options && ((cb = options),(options = null));
  return request(url, shortcutOptions(options, 'PUT'), cb);
}

function del(url, options, cb) {
  "function" == typeof options && ((cb = options),(options = null));
  return request(url, shortcutOptions(options, 'DELETE'), cb);
}

function head(url, options, cb) {
  "function" == typeof options && ((cb = options),(options = null));
  return request(url, shortcutOptions(options, 'HEAD'), cb);
}

function __pipe(dest, opts) {
  var self = this;
  self.decoding = "buffer";
  if (self.response) {
      if (self._destdata) {
          return console.error("You cannot pipe after data has been emitted from the response.");
      } else if (self._ended) {
          return console.error("You cannot pipe after the response has been ended.");
      } else {
          stream.Stream.prototype.pipe.call(self, dest, opts);
          self.pipeDest(dest);
          return dest;
      }
  } else {
      self.dests.push(dest);
      stream.Stream.prototype.pipe.call(self, dest, opts);
      return dest;
  }

};

function __form(data){
  this.options.form = data;
  var self = request(this.url, shortcutOptions(this.options, this.options.method));
  return self;
}

function json(url, data, options, method) {
  options = options || {};
  options.parser = (typeof options.parser !== "undefined") ? options.parser : parsers.auto;
  options.headers = options.headers || {};
  options.headers['content-type'] = 'application/json';
  options.data = JSON.stringify(data);
  options.method = method || 'GET';
  return request(url, options);
}

function postJson(url, data, options) {
  return json(url, data, options, 'POST');
}

var parsers = {
  auto: function(data, callback) {
    var contentType = this.headers['content-type'];
    var contentParser;
    if (contentType) {
      contentType = contentType.replace(/;.+/, ''); // remove all except mime type (eg. text/html; charset=UTF-8)
      if (contentType in parsers.auto.matchers) {
        contentParser = parsers.auto.matchers[contentType];
      } else {
        // custom (vendor) mime types
        var parts = contentType.match(/^([\w-]+)\/vnd((?:\.(?:[\w-]+))+)\+([\w-]+)$/i);
        if (parts) {
          var type = parts[1];
          var vendors = parts[2].substr(1).split('.');
          var subtype = parts[3];
          var vendorType;
          while (vendors.pop() && !(vendorType in parsers.auto.matchers)) {
            vendorType = vendors.length
              ? type + '/vnd.' + vendors.join('.') + '+' + subtype
              : vendorType = type + '/' + subtype;
          }
          contentParser = parsers.auto.matchers[vendorType];
        }
      }
    }
    if (typeof contentParser == 'function') {
      contentParser.call(this, data, callback);
    } else {
      callback(null, data);
    }
  },
  json: function(data, callback) {
    if (data && data.length) {
      try {
        callback(null, JSON.parse(data));
      } catch (err) {
        err.message = 'Failed to parse JSON body: ' + err.message;
        callback(err, null);
      }
    } else {
      callback(null, null);
    }
  }
};

parsers.auto.matchers = {
  'application/json': parsers.json
};

try {
  var yaml = require('yaml');

  parsers.yaml = function(data, callback) {
    if (data) {
      try {
        callback(null, yaml.eval(data));
      } catch (err) {
        err.message = 'Failed to parse YAML body: ' + err.message;
        callback(err, null);
      }
    } else {
      callback(null, null);
    }
  };

  parsers.auto.matchers['application/yaml'] = parsers.yaml;
} catch(e) {}

try {
  var xml2js = require('xml2js');

  parsers.xml = function(data, callback) {
    if (data) {
      var parser = new xml2js.Parser();
      parser.parseString(data, function(err, data) {
        if (err) {
          err.message = 'Failed to parse XML body: ' + err.message;
        }
        callback(err, data);
      });
    } else {
      callback(null, null);
    }
  };

  parsers.auto.matchers['application/xml'] = parsers.xml;
} catch(e) { }

var decoders = {
  gzip: function(buf, callback) {
    zlib.gunzip(buf, callback);
  },
  deflate: function(buf, callback) {
    zlib.inflate(buf, callback);
  }
};


function Service(defaults) {
  if (defaults.baseURL) {
   this.baseURL = defaults.baseURL;
   delete defaults.baseURL;
  }

  this.defaults = defaults;
}

mixin(Service.prototype, {
  request: function(path, options) {
    return request(this._url(path), this._withDefaults(options));
  },
  get: function(path, options) {
    return get(this._url(path), this._withDefaults(options));
  },
  patch: function(path, options) {
    return patch(this._url(path), this._withDefaults(options));
  },
  put: function(path, options, cb) {
    return put(this._url(path), this._withDefaults(options), cb);
  },
  post: function(path, options) {
    return post(this._url(path), this._withDefaults(options));
  },
  json: function(method, path, data, options) {
    return json(this._url(path), data, this._withDefaults(options), method);
  },
  del: function(path, options) {
    return del(this._url(path), this._withDefaults(options));
  },
  _url: function(path) {
    if (this.baseURL) return url.resolve(this.baseURL, path);
    else return path;
  },
  _withDefaults: function(options) {
    var o = mixin({}, this.defaults);
    return mixin(o, options);
  }
});

function service(constructor, defaults, methods) {
  constructor.prototype = new Service(defaults || {});
  mixin(constructor.prototype, methods);
  return constructor;
}

mixin(exports, {
  Request: Request,
  Service: Service,
  request: request,
  service: service,
  get: get,
  patch: patch,
  post: post,
  put: put,
  del: del,
  head: head,
  json: json,
  postJson: postJson,
  parsers: parsers,
  file: form.file,
  data: form.data
});
