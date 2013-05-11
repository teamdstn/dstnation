//[DEPENDENCE] :_________________________________
var tls       = require("tls")
  , url       = require("url")
  , http      = require("http")
  , https     = require("https")
  , stream    = require("stream")
  , qs        = require("querystring")

  , oauth     = require("./_request/oauth")
  , cookier   = require("./_request/cookier")
  , aws       = require("./_request/aws")
  , Agent     = require("./_request/agent")
  , FormData  = require("./_request/form_data")
  , tunnel    = require("./tunnel")
  , mime      = require("./mime")


;//_______________________________________________
//[INITIALIZE] :----------------------------------
var log         = process.logging ? process.logging("request") : null
  , isUrl       = /^https?:/
  , globalPool  = {}
  , cookieJar   = cookier.jar()
  , defaultModules  = {"http:": http, "https:": https}
;//------------------------------------------------

exports = module.exports = request;
exports.cookier = cookier;

var __Array=Array.prototype, __String=String.prototype, __Object=Object.prototype, __Function=Function.prototype, __each=__Array.forEach, __define=Object.defineProperty ,keys=Object.keys
    , push=__Array.push ,slice=__Array.slice ,concat=__Array.concat ,unshift=__Array.unshift ,toString=__Object.toString ,hasOwnProperty=__Object.hasOwnProperty
    , inherits = function(ctor,stor){ctor.super_ = stor;ctor.prototype=Object.create(stor.prototype,{constructor:{value:ctor,enumerable:false,writable:true,configurable:true}})}
    , is = {"arr": __Array.isArray || function (o) { return toString.call(o) == "[object Array]";}, "obj":function (obj) { return obj === Object(obj);}}
    , each = function(o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); }
    , include = function(o, n){ return !!~('' + o).indexOf(n); }
;//--------------------------------
each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (nm) { is[nm.slice(0,3).toLowerCase()] = function (o) { return toString.call(o) == "[object " + nm + "]"; }; });

function toBase64(str)    { return new Buffer(str || "", "ascii").toString("base64"); }
function isReadStream(rs) { return rs.readable && rs.path && rs.mode; }
function copy(obj)        { var o = {}; keys(obj).forEach(function(i) { o[i] = obj[i]; }); return o; }
function uuid()           {for(var a=[],b=0;36>b;b++)a[b]=Math.floor(16*Math.random());a[14]=4;a[19]=a[19]&3|8;for(b=0;36>b;b++)a[b]="0123456789ABCDEF"[a[b]];a[8]=a[13]=a[18]=a[23]="-";return a.join("")};
/**
 * $Function
 * @param {Object} options
 * @return {Function}
 * @api public
 */


function Request(options) {
    options = options || {};
    var _rb;
    stream.Stream.call(this);
    this.writable = this.readable = true;
    is.str(options) && (options = {
        uri: options
    });
    _rb = keys(Request.prototype);
    for (var i in options) _rb.indexOf(i) === -1 ? this[i] = options[i] : is.fun(options[i]) && delete options[i];
    options = copy(options);
    this.init(options);
}

inherits(Request, stream.Stream);

Request.prototype.init = function(options) {
    var self = this;
    if (!options) options = {};
    if (process.env.NODE_DEBUG && /request/.test(process.env.NODE_DEBUG)) console.error("REQUEST", options);
    if (!self.pool && self.pool !== false) self.pool = globalPool;
    self.dests = [];
    self.__isRequestRequest = true;
    if (!self._callback && self.callback) {
        self._callback = self.callback;
        self.callback = function() {
            if (self._callbackCalled) return;
            self._callback.apply(self, arguments);
            self._callbackCalled = true;
        };
        self.on("error", self.callback.bind());
        self.on("complete", self.callback.bind(self, null));
    }
    if (self.url) {
        self.uri = self.url;
        delete self.url;
    }
    if (!self.uri) {
        throw new Error("options.uri is a required argument");
    } else {
        if (typeof self.uri == "string") self.uri = url.parse(self.uri);
    }
    if (self.proxy) {
        if (typeof self.proxy == "string") self.proxy = url.parse(self.proxy);
        if (http.globalAgent && self.uri.protocol === "https:") {
            var tunnelFn = self.proxy.protocol === "http:" ? tunnel.httpsOverHttp : tunnel.httpsOverHttps;
            var tunnelOptions = {
                proxy: {
                    host: self.proxy.hostname,
                    port: +self.proxy.port,
                    proxyAuth: self.proxy.auth
                },
                ca: this.ca
            };
            self.agent = tunnelFn(tunnelOptions);
            self.tunnel = true;
        }
    }
    if (!self.uri.host || !self.uri.pathname) {
        var faultyUri = url.format(self.uri);
        var message = 'Invalid URI "' + faultyUri + '"';
        if (keys(options).length === 0) {
            message += ". This can be caused by a crappy redirection.";
        }
        self.emit("error", new Error(message));
        return;
    }
    self._redirectsFollowed = self._redirectsFollowed || 0;
    self.maxRedirects = self.maxRedirects !== undefined ? self.maxRedirects : 10;
    self.followRedirect = self.followRedirect !== undefined ? self.followRedirect : true;
    self.followAllRedirects = self.followAllRedirects !== undefined ? self.followAllRedirects : false;
    if (self.followRedirect || self.followAllRedirects) self.redirects = self.redirects || [];
    self.headers = self.headers ? copy(self.headers) : {};
    self.setHost = false;
    if (!self.headers.host) {
        self.headers.host = self.uri.hostname;
        if (self.uri.port) {
            if (!(self.uri.port === 80 && self.uri.protocol === "http:") && !(self.uri.port === 443 && self.uri.protocol === "https:")) self.headers.host += ":" + self.uri.port;
        }
        self.setHost = true;
    }
    self.jar(self._jar || options.jar);
    if (!self.uri.pathname) {
        self.uri.pathname = "/";
    }
    if (!self.uri.port) {
        if (self.uri.protocol == "http:") {
            self.uri.port = 80;
        } else if (self.uri.protocol == "https:") {
            self.uri.port = 443;
        }
    }
    if (self.proxy && !self.tunnel) {
        self.port = self.proxy.port;
        self.host = self.proxy.hostname;
    } else {
        self.port = self.uri.port;
        self.host = self.uri.hostname;
    }
    self.clientErrorHandler = function(error) {
        if (self._aborted) return;
        if (self.setHost) delete self.headers.host;
        if (self.req._reusedSocket && error.code === "ECONNRESET" && self.agent.addRequestNoreuse) {
            self.agent = {
                addRequest: self.agent.addRequestNoreuse.bind(self.agent)
            };
            self.start();
            self.req.end();
            return;
        }
        if (self.timeout && self.timeoutTimer) {
            clearTimeout(self.timeoutTimer);
            self.timeoutTimer = null;
        }
        self.emit("error", error);
    };
    self._parserErrorHandler = function(error) {
        if (this.res) {
            if (this.res.request) {
                this.res.request.emit("error", error);
            } else {
                this.res.emit("error", error);
            }
        } else {
            this._httpMessage.emit("error", error);
        }
    };
    if (options.form) {
        self.form(options.form);
    }
    if (options.oauth) {
        self.oauth(options.oauth);
    }
    if (options.aws) {
        self.aws(options.aws);
    }
    if (self.uri.auth && !self.headers.authorization) {
        self.headers.authorization = "Basic " + toBase64(self.uri.auth.split(":").map(function(item) {
            return qs.unescape(item);
        }).join(":"));
    }
    if (self.proxy && self.proxy.auth && !self.headers["proxy-authorization"] && !self.tunnel) {
        self.headers["proxy-authorization"] = "Basic " + toBase64(self.proxy.auth.split(":").map(function(item) {
            return qs.unescape(item);
        }).join(":"));
    }
    if (options.qs) self.qs(options.qs);
    if (self.uri.path) {
        self.path = self.uri.path;
    } else {
        self.path = self.uri.pathname + (self.uri.search || "");
    }
    if (self.path.length === 0) self.path = "/";
    if (self.proxy && !self.tunnel) self.path = self.uri.protocol + "//" + self.uri.host + self.path;
    if (options.json) {
        self.json(options.json);
    } else if (options.multipart) {
        self.boundary = uuid();
        self.multipart(options.multipart);
    }
    if (self.body) {
        var length = 0;
        if (!Buffer.isBuffer(self.body)) {
            if (Array.isArray(self.body)) {
                for (var i = 0; i < self.body.length; i++) {
                    length += self.body[i].length;
                }
            } else {
                self.body = new Buffer(self.body);
                length = self.body.length;
            }
        } else {
            length = self.body.length;
        }
        if (length) {
            self.headers["content-length"] = length;
        } else {
            throw new Error("Argument error, options.body.");
        }
    }
    var protocol = self.proxy && !self.tunnel ? self.proxy.protocol : self.uri.protocol, httpModules = self.httpModules || {};
    self.httpModule = httpModules[protocol] || defaultModules[protocol];
    if (!self.httpModule) throw new Error("Invalid protocol");
    if (options.ca) self.ca = options.ca;
    if (!self.agent) {
        if (options.agentOptions) self.agentOptions = options.agentOptions;
        if (options.agentClass) {
            self.agentClass = options.agentClass;
        } else if (options.forever) {
            self.agentClass = protocol === "http:" ? Agent : Agent.SSL;
        } else {
            self.agentClass = self.httpModule.Agent;
        }
    }
    if (self.pool === false) {
        self.agent = false;
    } else {
        self.agent = self.agent || self.getAgent();
        if (self.maxSockets) {
            self.agent.maxSockets = self.maxSockets;
        }
        if (self.pool.maxSockets) {
            self.agent.maxSockets = self.pool.maxSockets;
        }
    }
    self.once("pipe", function(src) {
        if (self.ntick && self._started) throw new Error("You cannot pipe to this stream after the outbound request has started.");
        self.src = src;
        if (isReadStream(src)) {
            if (!self.headers["content-type"] && !self.headers["Content-Type"]) self.headers["content-type"] = mime.lookup(src.path);
        } else {
            if (src.headers) {
                for (var i in src.headers) {
                    if (!self.headers[i]) {
                        self.headers[i] = src.headers[i];
                    }
                }
            }
            if (src.method && !self.method) {
                self.method = src.method;
            }
        }
        self.on("pipe", function() {
            console.error("You have already piped to this stream. Pipeing twice is likely to break the request.");
        });
    });
    process.nextTick(function() {
        if (self._aborted) return;
        if (self._form) {
            self.setHeaders(self._form.getHeaders());
            self._form.pipe(self);
        }
        if (self.body) {
            if (Array.isArray(self.body)) {
                self.body.forEach(function(part) {
                    self.write(part);
                });
            } else {
                self.write(self.body);
            }
            self.end();
        } else if (self.requestBodyStream) {
            console.warn("options.requestBodyStream is deprecated, please pass the request object to stream.pipe.");
            self.requestBodyStream.pipe(self);
        } else if (!self.src) {
            if (self.method !== "GET" && typeof self.method !== "undefined") {
                self.headers["content-length"] = 0;
            }
            self.end();
        }
        self.ntick = true;
    });
};

Request.prototype._updateProtocol = function() {
    var self = this;
    var protocol = self.uri.protocol;
    if (protocol === "https:") {
        if (self.proxy) {
            self.tunnel = true;
            var tunnelFn = self.proxy.protocol === "http:" ? tunnel.httpsOverHttp : tunnel.httpsOverHttps;
            var tunnelOptions = {
                proxy: {
                    host: self.proxy.hostname,
                    post: +self.proxy.port,
                    proxyAuth: self.proxy.auth
                },
                ca: self.ca
            };
            self.agent = tunnelFn(tunnelOptions);
            return;
        }
        self.httpModule = https;
        switch (self.agentClass) {
          case Agent:
            self.agentClass = Agent.SSL;
            break;

          case http.Agent:
            self.agentClass = https.Agent;
            break;

          default:
            return;
        }
        if (self.agent) self.agent = self.getAgent();
    } else {
        if (log) log("previously https, now http");
        if (self.tunnel) self.tunnel = false;
        self.httpModule = http;
        switch (self.agentClass) {
          case Agent.SSL:
            self.agentClass = Agent;
            break;

          case https.Agent:
            self.agentClass = http.Agent;
            break;

          default:
            return;
        }
        if (self.agent) {
            self.agent = null;
            self.agent = self.getAgent();
        }
    }
};

Request.prototype.getAgent = function() {
    var Agent = this.agentClass;
    var options = {};
    if (this.agentOptions) {
        for (var i in this.agentOptions) {
            options[i] = this.agentOptions[i];
        }
    }
    if (this.ca) options.ca = this.ca;
    var poolKey = "";
    if (Agent !== this.httpModule.Agent) {
        poolKey += Agent.name;
    }
    if (!this.httpModule.globalAgent) {
        options.host = this.host;
        options.port = this.port;
        if (poolKey) poolKey += ":";
        poolKey += this.host + ":" + this.port;
    }
    var proxy = this.proxy;
    if (typeof proxy === "string") proxy = url.parse(proxy);
    var caRelevant = proxy && proxy.protocol === "https:" || this.uri.protocol === "https:";
    if (options.ca && caRelevant) {
        if (poolKey) poolKey += ":";
        poolKey += options.ca;
    }
    if (!poolKey && Agent === this.httpModule.Agent && this.httpModule.globalAgent) {
        return this.httpModule.globalAgent;
    }
    poolKey = this.uri.protocol + poolKey;
    if (this.pool[poolKey]) return this.pool[poolKey];
    return this.pool[poolKey] = new Agent(options);
};

Request.prototype.start = function() {
    var self = this;
    if (self._aborted) return;
    self._started = true;
    self.method = self.method || "GET";
    self.href = self.uri.href;
    log && log("%method %href", self);
    if (self.src && self.src.stat && self.src.stat.size) {
        self.headers["content-length"] = self.src.stat.size;
    }
    if (self._aws) {
        self.aws(self._aws, true);
    }
    self.req = self.httpModule.request(self, function(response) {
        var alertFail;
        if (response.connection.listeners("error").indexOf(self._parserErrorHandler) === -1) {
            response.connection.once("error", self._parserErrorHandler);
        }
        if (response.statusCode >= 400) {
            self.emit("fail", response.statusCode, self);
        }
        if (self._aborted) return;
        if (self._paused) response.pause();
        self.response = response;
        response.request = self;
        response.toJSON = toJSON;
        if (self.httpModule === https && self.strictSSL && !response.client.authorized) {
            var sslErr = response.client.authorizationError;
            self.emit("error", new Error("SSL Error: " + sslErr));
            return;
        }
        if (self.setHost) delete self.headers.host;
        if (self.timeout && self.timeoutTimer) {
            clearTimeout(self.timeoutTimer);
            self.timeoutTimer = null;
        }
        var addCookie = function(cookie) {
            if (self._jar) self._jar.add(cookier.cook(cookie));
            else cookieJar.add(cookier.cook(cookie));
        };


        if (response.headers["set-cookie"] && !self._disableCookies) {
            if (Array.isArray(response.headers["set-cookie"]))
              response.headers["set-cookie"].forEach(addCookie);
            else addCookie(response.headers["set-cookie"]);
        }

        if (response.headers.location) {
          self.emit("redirection", response);
        }
        self.getJar = function(ur, nm){
          ur = ur || this.uri.href;
          var _coo = self._jar ? self._jar.get({url:ur}) : cookieJar.get({url:ur});
          if(!nm) return _coo;
          return _coo.filter(function(o,n){
            return o.name === nm;
          })
        }

        if (response.statusCode >= 300 && response.statusCode < 400 && (self.followAllRedirects || self.followRedirect && self.method !== "PUT" && self.method !== "POST" && self.method !== "DELETE") && response.headers.location) {
            if (self._redirectsFollowed >= self.maxRedirects) {
                self.emit("error", new Error("Exceeded maxRedirects. Probably stuck in a redirect loop " + self.uri.href));
                return;
            }
            self._redirectsFollowed += 1;
            if (!isUrl.test(response.headers.location)) {
                response.headers.location = url.resolve(self.uri.href, response.headers.location);
            }
            var uriPrev = self.uri;
            self.uri = url.parse(response.headers.location);
            if (self.uri.protocol !== uriPrev.protocol) {
                self._updateProtocol();
            }
            self.redirects.push({
                statusCode: response.statusCode,
                redirectUri: response.headers.location
            });
            if (self.followAllRedirects) self.method = "GET";
            delete self.src;
            delete self.req;
            delete self.agent;
            delete self._started;
            delete self.body;
            if (self.headers) {
                delete self.headers.host;
            }
            if (log) log("Redirect to %uri", self);
            self.init();
            return;
        } else {
            self._redirectsFollowed = self._redirectsFollowed || 0;
            response.on("close", function() {
                if (!self._ended) self.response.emit("end");
            });
            if (self.encoding) {
                if (self.dests.length !== 0) {
                    console.error("Ingoring encoding parameter as this stream is being piped to another stream which makes the encoding option invalid.");
                } else {
                    response.setEncoding(self.encoding);
                }
            }
            self.dests.forEach(function(dest) {
                self.pipeDest(dest);
            });
            response.on("data", function(chunk) {
                self._destdata = true;
                self.emit("data", chunk);
            });
            response.on("end", function(chunk) {
                self._ended = true;
                self.emit("end", chunk);
            });
            response.on("close", function() {
                self.emit("close");
            });
            self.emit("response", response);

            if (self.callback) {
                var buffer = [];
                var bodyLen = 0;
                self.on("data", function(chunk) {
                    buffer.push(chunk);
                    bodyLen += chunk.length;
                });

                self.on("end", function() {
                    if (self._aborted) return;
                    if (buffer.length && Buffer.isBuffer(buffer[0])) {
                        var body = new Buffer(bodyLen);
                        var i = 0;
                        buffer.forEach(function(chunk) {
                            chunk.copy(body, i, 0, chunk.length);
                            i += chunk.length;
                        });
                        if (self.encoding === null) {
                            response.body = body;
                        } else {
                            response.body = body.toString(self.encoding);
                        }
                    } else if (buffer.length) {
                        response.body = buffer.join("");
                    }
                    if (self._json) {
                        try {
                            response.body = JSON.parse(response.body);
                        } catch (e) {}
                    }
                    self.emit("complete", response, response.body);
                });
            }
        }
    });
    if (self.timeout && !self.timeoutTimer) {
        self.timeoutTimer = setTimeout(function() {
            self.req.abort();
            var err = new Error("ETIMEDOUT");
            err.code = "ETIMEDOUT";
            self.emit("error", err);
        }, self.timeout);
        if (self.req.setTimeout) {
            self.req.setTimeout(self.timeout, function() {
                if (self.req) {
                    self.req.abort();
                    var err = new Error("ESOCKETTIMEDOUT");
                    err.code = "ESOCKETTIMEDOUT";
                    self.emit("error", err);
                }
            });
        }
    }
    self.req.on("error", self.clientErrorHandler);
    self.req.on("drain", function() {
        self.emit("drain");
    });
    self.on("end", function() {
        if (self.req.connection) self.req.connection.removeListener("error", self._parserErrorHandler);
    });
    self.emit("request", self.req);
};

Request.prototype.abort = function() {
    this._aborted = true;
    if (this.req) {
        this.req.abort();
    } else if (this.response) {
        this.response.abort();
    }
    this.emit("abort");
};

Request.prototype.pipeDest = function(dest) {
    var response = this.response;
    if (dest.headers) {
        dest.headers["content-type"] = response.headers["content-type"];
        if (response.headers["content-length"]) {
            dest.headers["content-length"] = response.headers["content-length"];
        }
    }
    if (dest.setHeader) {
        for (var i in response.headers) {
            dest.setHeader(i, response.headers[i]);
        }
        dest.statusCode = response.statusCode;
    }
    if (this.pipefilter) this.pipefilter(response, dest);
};

Request.prototype.setHeader = function(name, value, clobber) {
    clobber === void 0 && (clobber = true);
    this.headers[name] = clobber || !this.headers.hasOwnProperty(name) ? value : this.headers[name] += "," + value;
    return this;
};

Request.prototype.setHeaders = function(headers) {
    for (var i in headers) {
        this.setHeader(i, headers[i]);
    }
    return this;
};

Request.prototype.qs = function(q, clobber) {
    var base = !clobber && this.uri.query ? qs.parse(this.uri.query) : {};
    for (var i in q) {
        base[i] = q[i];
    }
    this.uri = this.url = url.parse(this.uri.href.split("?")[0] + "?" + qs.stringify(base));
    return this;
};

Request.prototype.form = function(form) {
    if (form) {
        this.headers["content-type"] = "application/x-www-form-urlencoded; charset=utf-8";
        this.body = qs.stringify(form).toString("utf8");
        return this;
    }
    this._form = new FormData();
    return this._form;
};

Request.prototype.multipart = function(multipart) {
    var self = this, c = "content-type";
    self.body = [];
    if (!self.headers[c]) {
        self.headers[c] = "multipart/related; boundary=" + self.boundary;
    } else {
        self.headers[c] = self.headers[c].split(";")[0] + "; boundary=" + self.boundary;
    }
    if (!multipart.forEach) throw new Error("Argument error, options.multipart.");
    if (self.preambleCRLF) {
        self.body.push(new Buffer("\r\n"));
    }
    multipart.forEach(function(part) {
        var body = part.body;
        if (body == null) throw Error("Body attribute missing in multipart.");
        delete part.body;
        var preamble = "--" + self.boundary + "\r\n";
        keys(part).forEach(function(key) {
            preamble += key + ": " + part[key] + "\r\n";
        });
        preamble += "\r\n";
        self.body.push(new Buffer(preamble));
        self.body.push(new Buffer(body));
        self.body.push(new Buffer("\r\n"));
    });
    self.body.push(new Buffer("--" + self.boundary + "--"));
    return self;
};

Request.prototype.json = function(val) {
    this.setHeader("content-type", "application/json");
    this.setHeader("accept", "application/json");
    this._json = true;
    if (typeof val === "boolean") {
        if (typeof this.body === "object") this.body = JSON.stringify(this.body);
    } else {
        this.body = JSON.stringify(val);
    }
    return this;
};

Request.prototype.aws = function(opts, now) {
    if (!now) {
        this._aws = opts;
        return this;
    }
    var date = new Date();
    this.setHeader("date", date.toUTCString());
    this.setHeader("authorization", aws.authorization({
        key: opts.key,
        secret: opts.secret,
        verb: this.method,
        date: date,
        resource: aws.canonicalizeResource("/" + opts.bucket + this.path),
        contentType: this.headers["content-type"] || "",
        md5: this.headers["content-md5"] || "",
        amazonHeaders: aws.canonicalizeHeaders(this.headers)
    }));
    return this;
};

Request.prototype.oauth = function(_oauth) {
    var form;
    if (this.headers["content-type"] && this.headers["content-type"].slice(0, "application/x-www-form-urlencoded".length) === "application/x-www-form-urlencoded") {
        form = qs.parse(this.body);
    }
    if (this.uri.query) {
        form = qs.parse(this.uri.query);
    }
    if (!form) form = {};
    var oa = {};
    for (var i in form) oa[i] = form[i];
    for (var i in _oauth) oa["oauth_" + i] = _oauth[i];
    if (!oa.oauth_version) oa.oauth_version = "1.0";
    if (!oa.oauth_timestamp) oa.oauth_timestamp = Math.floor(new Date().getTime() / 1e3).toString();
    if (!oa.oauth_nonce) oa.oauth_nonce = uuid().replace(/-/g, "");
    oa.oauth_signature_method = "HMAC-SHA1";
    var consumer_secret = oa.oauth_consumer_secret;
    delete oa.oauth_consumer_secret;
    var token_secret = oa.oauth_token_secret;
    delete oa.oauth_token_secret;
    var baseurl = this.uri.protocol + "//" + this.uri.host + this.uri.pathname;
    var signature = oauth.hmacsign(this.method, baseurl, oa, consumer_secret, token_secret);
    for (var i in form) {
        if (i.slice(0, "oauth_") in _oauth) {} else {
            delete oa["oauth_" + i];
            delete oa[i];
        }
    }
    this.headers.Authorization = "OAuth " + keys(oa).sort().map(function(i) {
        return i + '="' + oauth.rfc3986(oa[i]) + '"';
    }).join(",");
    this.headers.Authorization += ',oauth_signature="' + oauth.rfc3986(signature) + '"';
    return this;
};


Request.prototype.jar = function(jar) {
    var cookies;
    if (this._redirectsFollowed === 0) {
        this.originalCookieHeader = this.headers.cookie;
    }
    if (jar === false) {
        cookies = false;
        this._disableCookies = true;
    } else if (jar) {
        cookies = jar.get({
            url: this.uri.href
        });
    } else {
        cookies = cookieJar.get({
            url: this.uri.href
        });
    }
    if (cookies && cookies.length) {
        var cookieString = cookies.map(function(c) {
            return c.name + "=" + c.value;
        }).join("; ");
        if (this.originalCookieHeader) {
            this.headers.cookie = this.originalCookieHeader + "; " + cookieString;
        } else {
            this.headers.cookie = cookieString;
        }
    }
    this._jar = jar;
    return this;
};

Request.prototype.pipe = function(dest, opts) {
    if (this.response) {
        if (this._destdata) {
            throw new Error("You cannot pipe after data has been emitted from the response.");
        } else if (this._ended) {
            throw new Error("You cannot pipe after the response has been ended.");
        } else {
            stream.Stream.prototype.pipe.call(this, dest, opts);
            this.pipeDest(dest);
            return dest;
        }
    } else {
        this.dests.push(dest);
        stream.Stream.prototype.pipe.call(this, dest, opts);
        return dest;
    }
};

Request.prototype.write = function() {
    if (!this._started) this.start();
    return this.req.write.apply(this.req, arguments);
};

Request.prototype.end = function(chunk) {
    if (chunk) this.write(chunk);
    if (!this._started) this.start();
    this.req.end();
};

Request.prototype.pause = function() {
    if (!this.response) this._paused = true; else this.response.pause.apply(this.response, arguments);
};

Request.prototype.resume = function() {
    if (!this.response) this._paused = false; else this.response.resume.apply(this.response, arguments);
};

Request.prototype.destroy = function() {
    if (!this._ended) this.end();
};

function initParams(uri, options, callback) {
    if (typeof options === "function" && !callback) callback = options;
    if (options && typeof options === "object") {
        options.uri = uri;
    } else if (typeof uri === "string") {
        options = {
            uri: uri
        };
    } else {
        options = uri;
        uri = options.uri;
    }
    return {
        uri: uri,
        options: options,
        callback: callback
    };
}

function request(uri, options, callback) {
    if (typeof uri === "undefined") throw new Error("undefined is not a valid uri or options object.");
    if (typeof options === "function" && !callback) callback = options;
    if (options && typeof options === "object") {
        options.uri = uri;
    } else if (typeof uri === "string") {
        options = {
            uri: uri
        };
    } else {
        options = uri;
    }
    if (callback) options.callback = callback;
    var r = new Request(options);
    return r;
}

request.initParams = initParams;

request.defaults = function(options, requester) {
    var def = function(method) {
        var d = function(uri, opts, callback) {
            var params = initParams(uri, opts, callback);
            for (var i in options) {
                if (params.options[i] === undefined) params.options[i] = options[i];
            }
            if (typeof requester === "function") {
                if (method === request) {
                    method = requester;
                } else {
                    params.options._requester = requester;
                }
            }
            return method(params.options, params.callback);
        };
        return d;
    }, __def;
    __def = def(request);
    __def.get = def(request.get);
    __def.post = def(request.post);
    __def.put = def(request.put);
    __def.head = def(request.head);
    __def.del = def(request.del);
    __def.cookie = def(request.cookie);
    __def.jar = def(request.jar);
    return __def;
};

request.forever = function(agentOptions, optionsArg) {
    var options = {};
    if (optionsArg) {
        for (option in optionsArg) {
            options[option] = optionsArg[option];
        }
    }
    if (agentOptions) options.agentOptions = agentOptions;
    options.forever = true;
    return request.defaults(options);
};

request.get = request;

request.post = function(uri, options, callback) {
    var params = initParams(uri, options, callback);
    params.options.method = "POST";
    return request(params.uri || null, params.options, params.callback);
};

request.put = function(uri, options, callback) {
    var params = initParams(uri, options, callback);
    params.options.method = "PUT";
    return request(params.uri || null, params.options, params.callback);
};

request.head = function(uri, options, callback) {
    var params = initParams(uri, options, callback);
    params.options.method = "HEAD";
    if (params.options.body || params.options.requestBodyStream || params.options.json && typeof params.options.json !== "boolean" || params.options.multipart) {
        throw new Error("HTTP HEAD requests MUST NOT include a request body.");
    }
    return request(params.uri || null, params.options, params.callback);
};

request.del = function(uri, options, callback) {
    var params = initParams(uri, options, callback);
    params.options.method = "DELETE";
    if (typeof params.options._requester === "function") {
        request = params.options._requester;
    }
    return request(params.uri || null, params.options, params.callback);
};

request.jar = function() {
    return cookier.jar();
};

request.cookie = function(str) {
    if (str && str.uri) str = str.uri;
    if (typeof str !== "string") throw new Error("The cookie function only accepts STRING as param");
    return cookier.cook(str);
};

function getSafe(self, uuid) {
    if (typeof self === "object" || typeof self === "function") var safe = {};
    if (Array.isArray(self)) var safe = [];
    var recurse = [];
    __define(self, uuid, {});
    var attrs = keys(self).filter(function(i) {
        if (i === uuid) return false;
        if (typeof self[i] !== "object" && typeof self[i] !== "function" || self[i] === null) return true;
        return !Object.getOwnPropertyDescriptor(self[i], uuid);
    });
    for (var i = 0; i < attrs.length; i++) {
        if (typeof self[attrs[i]] !== "object" && typeof self[attrs[i]] !== "function" || self[attrs[i]] === null) {
            safe[attrs[i]] = self[attrs[i]];
        } else {
            recurse.push(attrs[i]);
            __define(self[attrs[i]], uuid, {});
        }
    }
    for (var i = 0; i < recurse.length; i++) {
        safe[recurse[i]] = getSafe(self[recurse[i]], uuid);
    }
    return safe;
}

function toJSON() {
    return getSafe(this, ((1 + Math.random()) * 65536 | 0).toString(16));
}

Request.prototype.toJSON = toJSON;