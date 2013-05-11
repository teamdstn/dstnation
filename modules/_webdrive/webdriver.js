//[] :____________________________
var EventEmitter = require('events').EventEmitter
  , fs        = require("fs")
  , pt        = require("path")
  , http      = require("http")
  , https     = require("https")
  , async     = require("../async")
  , element   = require('./element').element
  , WIRE_ERR  = require('./jsonwire-errors.js')
;//_________________________________
var __slice = Array.prototype.slice
;//_________________________________

var webdriver = module.exports = function (remoteWdConfig) {
    this.sessionID = null;
    this.username = remoteWdConfig.username || process.env.SAUCE_USERNAME;
    this.accessKey = remoteWdConfig.accessKey || process.env.SAUCE_ACCESS_KEY;
    this.basePath = remoteWdConfig.path || "/wd/hub";
    this.https = remoteWdConfig.https || false;
    this.options = {
      host: remoteWdConfig.host || "127.0.0.1",
      port: remoteWdConfig.port || 4444,
      path: (this.basePath + "/session").replace("//", "/")
    };
    this.defaultCapabilities = {
      browserName: "firefox",
      version: "",
      javascriptEnabled: true,
      platform: "ANY"
      /*
        ,'chrome.switches': [
          '--disable-popup-blocking',
          '--proxy-server=http://112.217.228.212:8080'
        ],
        'opera.arguments': '-nowin'
        */

    };
    if (this.username != null && this.accessKey != null) {
      this.defaultCapabilities.platform = "VISTA";
    }
  };





webdriver.prototype = new EventEmitter();

webdriver.prototype._getJsonwireError = function (status) {
  var jsonwireError = WIRE_ERR.filter(function (err) {
    return err.status = status;
  });
  return jsonwireError.length > 0 ? jsonwireError[0] : null;
};

webdriver.prototype._newError = function (opts) {
  var err = new Error();
  for (var k in opts) {
    err[k] = opts[k];
  }
  err.inspect = function () {
    var res = "";
    var browserError = null;
    for (var k in this) {
      var _this = this;
      (function () {
        var v = _this[k];
        if (typeof v === "object") {
          if (v["class"] != null && v["class"].match(/org.openqa.selenium.remote.Response/)) {
            var vAsStr = JSON.stringify(v, function (key, value) {
              if (key === "screen" || key === "stackTrace" || key === "buildInformation" || key === "localizedMessage") {
                return "[hidden]";
              } else if (key === "message") {
                var messageMatch = value.match(/([^\n]+)\nCommand duration/);
                if (messageMatch != null && messageMatch.length >= 1) {
                  browserError = messageMatch[1].trim();
                }
                return value;
              } else {
                return value;
              }
            }, "  ");
            res += k + ": " + vAsStr + "\n";
          } else {
            var vAsStr = JSON.stringify(v, undefined, "  ");
            var maxLength = 1e3;
            if (vAsStr.length > maxLength) {
              vAsStr = vAsStr.substr(0, maxLength) + "\n...";
            }
            res += k + ": " + vAsStr + "\n";
          }
        } else if (typeof v != "function") {
          res += k + ": " + v + "\n";
        }
      })();
    }
    if (browserError != null) {
      res += "browser-error: " + browserError + "\n";
    }
    return res;
  };
  return err;
};

webdriver.prototype._isWebDriverException = function (res) {
  var _ref;
  if ((typeof res !== "undefined" && res !== null ? (_ref = res["class"]) != null ? _ref.indexOf("WebDriverException") : void 0 : void 0) > 0) {
    return true;
  }
  return false;
};

webdriver.prototype._simpleCallback = function (cb) {
  var _this = this;
  return function (res) {
    if (res == null) {
      if (cb != null) {
        return cb(null);
      }
    } else {

      if (res.code === "ECONNREFUSED") {
        console.log(res.code);
        return;
      }

      var data = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        data += chunk.toString();
      });
      res.on("end", function () {
        if (data == "" || data == "OK") {
          return cb(null);
        } else {
          var jsonWireRes = null;
          try {
            jsonWireRes = JSON.parse(data);
          } catch (err) {}
          if (jsonWireRes !== null && jsonWireRes.sessionId != null && jsonWireRes.status != null) {
            if (jsonWireRes.status === 0) {
              return cb(null);
            } else {
              return cb(_this._newError({
                message: "Error response status.",
                status: jsonWireRes.status,
                cause: jsonWireRes
              }));
            }
          } else {
            if (cb != null) {
              return cb(_this._newError({
                message: "Unexpected data in simpleCallback.",
                data: data
              }));
            }
          }
        }
      });
    }
  };
};

webdriver.prototype._callbackWithDataBase = function (cb) {
  var strip = function strip(str) {
      var x = [];
      for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i)) {
          x.push(str.charAt(i));
        }
      }
      return x.join("");
    };
  var _this = this;
  return function (res) {
    res.setEncoding("utf8");
    var data = "";
    res.on("data", function (chunk) {
      data += chunk.toString();
    });
    res.on("end", function () {
      var obj;
      try {
        obj = JSON.parse(strip(data));
      } catch (e) {
        return cb(_this._newError({
          message: "Not JSON response",
          data: data
        }));
      }
      if (obj.status > 0) {
        var err = _this._newError({
          message: "Error response status.",
          status: obj.status,
          cause: obj
        });
        var jsonwireError = _this._getJsonwireError(obj.status);
        if (jsonwireError != null) {
          err["jsonwire-error"] = jsonwireError;
        }
        cb(err);
      } else {
        cb(null, obj);
      }
    });
  };
};

webdriver.prototype._callbackWithData = function (cb) {
  var _this = this;
  return _this._callbackWithDataBase(function (err, obj) {
    if (err != null) {
      return cb(err);
    }
    if (_this._isWebDriverException(obj.value)) {
      return cb(_this._newError({
        message: obj.value.message,
        cause: obj.value
      }));
    }
    cb(null, obj.value);
  });
};

webdriver.prototype._elementCallback = function (cb) {
  var _this = this;
  return _this._callbackWithDataBase(function (err, obj) {
    if (err != null) {
      return cb(err);
    }
    if (_this._isWebDriverException(obj.value)) {
      return cb(_this._newError({
        message: obj.value.message,
        cause: obj.value
      }));
    }
    if (!obj.value.ELEMENT) {
      cb(_this._newError({
        message: "no ELEMENT in response value field.",
        cause: obj
      }));
    } else {
      var el = new element(obj.value.ELEMENT, _this);
      cb(null, el);
    }
  });
};

webdriver.prototype._elementsCallback = function (cb) {
  var _this = this;
  return _this._callbackWithDataBase(function (err, obj) {
    if (err != null) {
      return cb(err);
    }
    if (_this._isWebDriverException(obj.value)) {
      return cb(_this._newError({
        message: obj.value.message,
        cause: obj.value
      }));
    }
    if (!(obj.value instanceof Array)) {
      return cb(_this._newError({
        message: "Response value field is not an Array.",
        cause: obj.value
      }));
    }
    var i, elements = [];
    for (i = 0; i < obj.value.length; i++) {
      var el = new element(obj.value[i].ELEMENT, _this);
      elements.push(el);
    }
    cb(null, elements);
  });
};

webdriver.prototype._newHttpOpts = function (method) {
  var opts = new Object();
  opts.method = method;
  for (var o in this.options) {
    opts[o] = this.options[o];
  }
  opts.headers = {};
  opts.headers["Connection"] = "keep-alive";
  if (opts.method === "POST" || opts.method === "GET") opts.headers["Accept"] = "application/json";
  if (opts.method == "POST") opts.headers["Content-Type"] = "application/json; charset=UTF-8";
  return opts;
};

webdriver.prototype.init = function (desired, cb) {
  var _this = this;
  if (typeof desired == "function") {
    cb = desired;
    desired = {};
  }
  var _desired = {};
  for (var k in desired) {
    _desired[k] = desired[k];
  }
  for (var k in this.defaultCapabilities) {
    _desired[k] = _desired[k] || this.defaultCapabilities[k];
  }
  var httpOpts = _this._newHttpOpts.apply(this, ["POST"]);
  if (_this.username != null && _this.accessKey != null) {
    var authString = _this.username + ":" + _this.accessKey;
    var buf = new Buffer(authString);
    httpOpts["headers"] = {
      Authorization: "Basic " + buf.toString("base64")
    };
  }
  var data = JSON.stringify({
    desiredCapabilities: _desired
  });
  httpOpts.headers["Content-Length"] = Buffer.byteLength(data, "utf8");
  var req = (this.https ? https : http).request(httpOpts, function (res) {
    var data = "";
    res.on("data", function (chunk) {
      data += chunk;
    });
    res.on("end", function () {
      if (res.headers.location == undefined) {
        console.log("[31mError[0m: The environment you requested was unavailable.\n");
        console.log("[33mReason[0m:\n");
        console.log(data);
        console.log("\nFor the available values please consult the WebDriver JSONWireProtocol,");
        console.log("located at: [33mhttp://code.google.com/p/selenium/wiki/JsonWireProtocol#/session[0m");
        if (cb) cb({
          message: "The environment you requested was unavailable."
        });
        return;
      }
      var locationArr = res.headers.location.split("/");
      _this.sessionID = locationArr[locationArr.length - 1];
      _this.emit("status", "\nDriving the web on session: " + _this.sessionID + "\n");
      if (cb) {
        cb(null, _this.sessionID);
      }
    });
  });
  req.on("error", function (e) {
    cb(e);
  });
  req.write(data);
  req.end();
};

webdriver.prototype._jsonWireCall = function (opts) {
  var _this = this;
  var httpOpts = _this._newHttpOpts.apply(_this, [opts.method]);
  var relPath = opts.relPath;
  var absPath = opts.absPath;
  if (this.sessionID != null) {
    httpOpts["path"] += "/" + this.sessionID;
  }
  if (relPath) {
    httpOpts["path"] += relPath;
  }
  if (absPath) {
    httpOpts["path"] = absPath;
  }
  var cb = opts.cb;
  if (opts.emit != null) {
    var _cb = cb;
    cb = function (res) {
      if (opts.emit != null) {
        _this.emit(opts.emit.event, opts.emit.message);
      }
      if (_cb) {
        _cb(null);
      }
    };
  }
  _this.emit("command", httpOpts["method"], httpOpts["path"].replace(this.sessionID, ":sessionID").replace(this.basePath, ""));
  var data = "";
  if (opts.data != null) {
    data = opts.data;
  }
  if (typeof data === "object") {
    data = JSON.stringify(data);
  }
  httpOpts.headers["Content-Length"] = Buffer.byteLength(data, "utf8");
  var req = (this.https ? https : http).request(httpOpts, cb);
  req.on("error", function (e) {
    cb(e);
  });
  req.write(data);
  req.end();
};

webdriver.prototype.status = function (cb) {
  this._jsonWireCall({
    method: "GET",
    absPath: this.basePath + "/status",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.sessions = function (cb) {
  this._jsonWireCall({
    method: "GET",
    absPath: this.basePath + "/sessions",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.chain = function () {
  var _this = this;
  if (!_this._queue) {
    _this._queue = async.queue(function (task, callback) {
      if (task.args.length > 0 && typeof task.args[task.args.length - 1] === "function") {
        var func = task.args[task.args.length - 1];
        task.args[task.args.length - 1] = function () {
          func.apply(null, arguments);
          callback();
        };
      } else {
        task.args.push(callback);
      }
      _this[task.name].apply(_this, task.args);
    }, 1);
  }
  var chain = {};
  var buildPlaceholder = function (name) {
      return function () {
        _this._queue.push({
          name: name,
          args: Array.prototype.slice.apply(arguments)
        });
        return chain;
      };
    };
  for (var name in _this) {
    if (typeof _this[name] === "function" && name !== "chain") {
      chain[name] = buildPlaceholder(name);
    }
  }
  return chain;
};

webdriver.prototype.altSessionCapabilities = function (cb) {
  var _this = this;
  _this.sessions.apply(this, [function (err, sessions) {
    if (err == null) {
      sessions = sessions.filter(function (session) {
        return session.id === _this.sessionID;
      });
      var _ref;
      return cb(null, (_ref = sessions[0]) != null ? _ref.capabilities : void 0);
    } else {
      return cb(err, sessions);
    }
  }]);
};

webdriver.prototype.sessionCapabilities = function (cb) {
  this._jsonWireCall({
    method: "GET",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.newWindow = function (url, name, cb) {
  if (cb == undefined && typeof name == "function") {
    cb = name;
    name = undefined;
  }
  this.execute("var url=arguments[0], name=arguments[1]; window.open(url, name);", [url, name], cb);
};

webdriver.prototype.close = function (cb) {
  this._jsonWireCall({
    method: "DELETE",
    relPath: "/window",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.window = function (windowRef, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/window",
    cb: this._simpleCallback(cb),
    data: {
      name: windowRef
    }
  });
};

webdriver.prototype.frame = function (frameRef, cb) {
  if (typeof frameRef == "function") {
    cb = frameRef;
    frameRef = undefined;
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/frame",
    cb: this._simpleCallback(cb),
    data: {
      id: frameRef
    }
  });
};

webdriver.prototype.windowName = function (cb) {
  this.safeEval("window.name", cb);
};

webdriver.prototype.windowHandle = function (cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/window_handle",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.windowHandles = function (cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/window_handles",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.quit = function (cb) {
  this._jsonWireCall({
    method: "DELETE",
    emit: {
      event: "status",
      message: "\nEnding your web drivage..\n"
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.eval = function (code, cb) {
  code = "return " + code + ";";
  this.execute.apply(this, [code, function (err, res) {
    if (err != null) {
      return cb(err);
    }
    cb(null, res);
  }]);
};

webdriver.prototype.safeEval = function (code, cb) {
  this.safeExecute.apply(this, [code, function (err, res) {
    if (err != null) {
      return cb(err);
    }
    cb(null, res);
  }]);
};

webdriver.prototype.execute = function (code, args, cb) {
  var _args, _i;
  _args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  code = _args[0], args = _args[1];
  if (typeof args === "undefined" || args === null) {
    args = [];
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/execute",
    cb: this._callbackWithData(cb),
    data: {
      script: code,
      args: args
    }
  });
};

var safeExecuteJsScript = fs.readFileSync(pt.join(__dirname, "browser/safe-execute.js"), "utf8");

webdriver.prototype.safeExecute = function (code, args, cb) {
  var _args, _i;
  _args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  code = _args[0], args = _args[1];
  if (typeof args === "undefined" || args === null) {
    args = [];
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/execute",
    cb: this._callbackWithData(cb),
    data: {
      script: safeExecuteJsScript,
      args: [code, args]
    }
  });
};

webdriver.prototype.executeAsync = function (code, args, cb) {
  var _args, _i;
  _args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  code = _args[0], args = _args[1];
  if (typeof args === "undefined" || args === null) {
    args = [];
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/execute_async",
    cb: this._callbackWithData(cb),
    data: {
      script: code,
      args: args
    }
  });
};

var safeExecuteAsyncJsScript = fs.readFileSync(pt.join(__dirname, "browser/safe-execute-async.js"), "utf8");

webdriver.prototype.safeExecuteAsync = function (code, args, cb) {
  var _args, _i;
  _args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  code = _args[0], args = _args[1];
  if (typeof args === "undefined" || args === null) {
    args = [];
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/execute_async",
    cb: this._callbackWithData(cb),
    data: {
      script: safeExecuteAsyncJsScript,
      args: [code, args]
    }
  });
};

webdriver.prototype.get = function (url, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/url",
    data: {
      url: url
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.refresh = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/refresh",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.forward = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/forward",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.back = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/back",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.setImplicitWaitTimeout = function (ms, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/timeouts/implicit_wait",
    data: {
      ms: ms
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.setWaitTimeout = webdriver.prototype.setImplicitWaitTimeout;

webdriver.prototype.setAsyncScriptTimeout = function (ms, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/timeouts/async_script",
    data: {
      ms: ms
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.setPageLoadTimeout = function (ms, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/timeouts",
    data: {
      type: "page load",
      ms: ms
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.element = function (using, value, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/element",
    data: {
      using: using,
      value: value
    },
    cb: this._elementCallback(cb)
  });
};

webdriver.prototype.elementOrNull = function (using, value, cb) {
  this.elements.apply(this, [using, value, function (err, elements) {
    if (err == null) if (elements.length > 0) {
      cb(null, elements[0]);
    } else {
      cb(null, null);
    } else cb(err);
  }]);
};

webdriver.prototype.elementIfExists = function (using, value, cb) {
  this.elements.apply(this, [using, value, function (err, elements) {
    if (err == null) if (elements.length > 0) {
      cb(null, elements[0]);
    } else {
      cb(null, undefined);
    } else cb(err);
  }]);
};

webdriver.prototype.elements = function (using, value, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/elements",
    data: {
      using: using,
      value: value
    },
    cb: this._elementsCallback(cb)
  });
};

webdriver.prototype.hasElement = function (using, value, cb) {
  this.elements.apply(this, [using, value, function (err, elements) {
    if (err == null) cb(null, elements.length > 0);
    else cb(err);
  }]);
};

webdriver.prototype.waitForElement = function (using, value, timeout, cb) {

  timeout = timeout || 200;


  console.log(using);
  var _this = this;
  var endTime = Date.now() + timeout;
  var poll = function () {
      _this.hasElement(using, value, function (err, isHere) {
        if (err) {
          return cb(err);
        }
        if (isHere) {
          cb(null);
        } else {
          if (Date.now() > endTime) {
            cb(new Error("Element didn't appear"));
          } else {
            setTimeout(poll, 200);
          }
        }
      });
    };
  poll();
};

webdriver.prototype.waitForVisible = function (using, value, timeout, cb) {
  var _this = this;
  var endTime = Date.now() + timeout;
  var poll = function () {
      _this.isVisible(using, value, function (err, visible) {
        if (err) {
          return cb(err);
        }
        if (visible) {
          cb(null);
        } else {
          if (Date.now() > endTime) {
            cb(new Error("Element didn't become visible"));
          } else {
            setTimeout(poll, 200);
          }
        }
      });
    };
  poll();
};

webdriver.prototype.takeScreenshot = function (cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/screenshot",
    cb: this._callbackWithData(cb)
  });
};

var elFuncSuffix = function (type) {
    var res = (" by " + type).replace(/(\s[a-z])/g, function ($1) {
      return $1.toUpperCase().replace(" ", "");
    });
    return res.replace("Xpath", "XPath");
  };

var elFuncFullType = function (type) {
    if (type == "css") {
      return "css selector";
    }
    return type;
  };

var elementFuncTypes = ["class name", "css selector", "id", "name", "link text", "partial link text", "tag name", "xpath", "css"];

for (var i = 0; i < elementFuncTypes.length; i++) {
  (function () {
    var type = elementFuncTypes[i];
    webdriver.prototype["element" + elFuncSuffix(type)] = function (value, cb) {
      webdriver.prototype.element.apply(this, [elFuncFullType(type), value, cb]);
    };
    webdriver.prototype["element" + elFuncSuffix(type) + "OrNull"] = function (value, cb) {
      webdriver.prototype.elements.apply(this, [elFuncFullType(type), value, function (err, elements) {
        if (err == null) if (elements.length > 0) {
          cb(null, elements[0]);
        } else {
          cb(null, null);
        } else cb(err);
      }]);
    };
    webdriver.prototype["element" + elFuncSuffix(type) + "IfExists"] = function (value, cb) {
      webdriver.prototype.elements.apply(this, [elFuncFullType(type), value, function (err, elements) {
        if (err == null) if (elements.length > 0) {
          cb(null, elements[0]);
        } else {
          cb(null, undefined);
        } else cb(err);
      }]);
    };
    webdriver.prototype["hasElement" + elFuncSuffix(type)] = function (value, cb) {
      webdriver.prototype.hasElement.apply(this, [elFuncFullType(type), value, cb]);
    };
    webdriver.prototype["waitForElement" + elFuncSuffix(type)] = function (value, timeout, cb) {
      webdriver.prototype.waitForElement.apply(this, [elFuncFullType(type), value, timeout, cb]);
    };
    webdriver.prototype["waitForVisible" + elFuncSuffix(type)] = function (value, timeout, cb) {
      webdriver.prototype.waitForVisible.apply(this, [elFuncFullType(type), value, timeout, cb]);
    };
    webdriver.prototype["elements" + elFuncSuffix(type)] = function (value, cb) {
      webdriver.prototype.elements.apply(this, [elFuncFullType(type), value, cb]);
    };
  })();
}

webdriver.prototype.getTagName = function (element, cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/element/" + element + "/name",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.getAttribute = function (element, attrName, cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/element/" + element + "/attribute/" + attrName,
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.isDisplayed = function (element, cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/element/" + element + "/displayed",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.displayed = webdriver.prototype.isDisplayed;

webdriver.prototype.getValue = function (element, cb) {
  this.getAttribute.apply(this, [element, "value", cb]);
};

webdriver.prototype.clickElement = function (element, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/element/" + element + "/click",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.getComputedCss = function (element, cssProperty, cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/element/" + element + "/css/" + cssProperty,
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.getComputedCSS = webdriver.prototype.getComputedCss;

webdriver.prototype.moveTo = function (element, xoffset, yoffset, cb) {
  var args, _i;
  element = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
  xoffset = args[0], yoffset = args[1], args;
  this._jsonWireCall({
    method: "POST",
    relPath: "/moveto",
    data: {
      element: element.toString(),
      xoffset: xoffset,
      yoffset: yoffset
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.buttonDown = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/buttondown",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.buttonUp = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/buttonup",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.click = function (button, cb) {
  var args, _i;
  args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  button = args[0], args;
  this._jsonWireCall({
    method: "POST",
    relPath: "/click",
    data: {
      button: button
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.doubleclick = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/doubleclick",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.type = function (element, keys, cb) {
  if (!(keys instanceof Array)) {
    keys = [keys];
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/element/" + element + "/value",
    data: {
      value: keys
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.keys = function (keys, cb) {
  if (!(keys instanceof Array)) {
    keys = [keys];
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/keys",
    data: {
      value: keys
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.clear = function (element, cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/element/" + element + "/clear",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.title = function (cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/title",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype._rawText = function (element, cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/element/" + element + "/text",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.text = function (element, cb) {
  var _this = this;
  if (typeof element === "undefined" || element == "body" || element === null) {
    _this.element.apply(this, ["tag name", "body", function (err, bodyEl) {
      if (err == null) {
        _this._rawText.apply(_this, [bodyEl, cb]);
      } else {
        cb(err);
      }
    }]);
  } else {
    _this._rawText.apply(_this, [element, cb]);
  }
};

webdriver.prototype.textPresent = function (searchText, element, cb) {
  this.text.apply(this, [element, function (err, text) {
    if (err) {
      cb(err, null);
    } else {
      cb(err, text.indexOf(searchText) >= 0);
    }
  }]);
};

webdriver.prototype.acceptAlert = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/accept_alert",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.dismissAlert = function (cb) {
  this._jsonWireCall({
    method: "POST",
    relPath: "/dismiss_alert",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.active = function (cb) {
  var _this = this;
  var cbWrap = function (e, o) {
      var el = new element(o["ELEMENT"], _this);
      cb(null, el);
    };
  this._jsonWireCall({
    method: "POST",
    relPath: "/element/active",
    cb: this._callbackWithData(cbWrap)
  });
};

webdriver.prototype.url = function (cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/url",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.allCookies = function (cb) {
  this._jsonWireCall({
    method: "GET",
    relPath: "/cookie",
    cb: this._callbackWithData(cb)
  });
};

webdriver.prototype.setCookie = function (cookie, cb) {
  if (typeof cookie !== "undefined" && cookie !== null && !((typeof cookie !== "undefined" && cookie !== null ? cookie.secure : void 0) != null)) {
    cookie.secure = false;
  }
  this._jsonWireCall({
    method: "POST",
    relPath: "/cookie",
    data: {
      cookie: cookie
    },
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.deleteAllCookies = function (cb) {
  this._jsonWireCall({
    method: "DELETE",
    relPath: "/cookie",
    cb: this._simpleCallback(cb)
  });
};

webdriver.prototype.deleteCookie = function (name, cb) {
  this._jsonWireCall({
    method: "DELETE",
    relPath: "/cookie/" + encodeURIComponent(name),
    cb: this._simpleCallback(cb)
  });
};

var _isVisible1 = function (element, cb) {
    this.getComputedCSS(element, "display", function (err, display) {
      if (err) {
        return cb(err);
      }
      cb(null, display !== "none");
    });
  };

var _isVisible2 = function (queryType, querySelector, cb) {
    this.elementIfExists(queryType, querySelector, function (err, element) {
      if (err) {
        return cb(err);
      }
      if (element == null) {
        return cb(null, false);
      }
      element.isVisible(cb);
    });
  };

webdriver.prototype.isVisible = function () {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  if (args.length <= 2) {
    return _isVisible1.apply(this, args);
  } else {
    return _isVisible2.apply(this, args);
  }
};

webdriver.prototype._waitForConditionImpl = function (conditionExpr, limit, poll, cb) {
  var _this = this;
  if (Date.now() < limit) {
    _this.safeEval.apply(_this, [conditionExpr, function (err, res) {
      if (err != null) {
        return cb(err);
      }
      if (res == true) {
        return cb(null, true);
      } else {
        setTimeout(function () {
          _this._waitForConditionImpl.apply(_this, [conditionExpr, limit, poll, cb]);
        }, poll);
      }
    }]);
  } else {
    _this.safeEval.apply(_this, [conditionExpr, function (err, res) {
      if (err != null) {
        return cb(err);
      }
      if (res == true) {
        return cb(null, true);
      } else {
        return cb("waitForCondition failure for: " + conditionExpr);
      }
    }]);
  }
};

webdriver.prototype.waitForCondition = function () {
  var _this = this;
  var args, cb, conditionExpr, limit, poll, timeout, _i;
  args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  conditionExpr = args[0], timeout = args[1], poll = args[2];
  timeout = timeout || 1e3;
  poll = poll || 100;
  limit = Date.now() + timeout;
  _this._waitForConditionImpl.apply(this, [conditionExpr, limit, poll, cb]);
};

webdriver.prototype._waitForConditionInBrowserJsScript = fs.readFileSync(pt.join(__dirname, "browser/wait-for-cond-in-browser.js"), "utf8");

webdriver.prototype.waitForConditionInBrowser = function () {
  var _this = this;
  var args, cb, conditionExpr, limit, poll, timeout, _i;
  args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
  conditionExpr = args[0], timeout = args[1], poll = args[2];
  timeout = timeout || 1e3;
  poll = poll || 100;
  _this.safeExecuteAsync.apply(_this, [_this._waitForConditionInBrowserJsScript, [conditionExpr, timeout, poll], function (err, res) {
    if (err != null) {
      return cb(err);
    }
    if (res != true) {
      return cb("waitForConditionInBrowser failure for: " + conditionExpr);
    }
    cb(null, res);
  }]);
};