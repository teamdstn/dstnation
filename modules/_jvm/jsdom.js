var dom = exports.dom = require("./level3/index").dom, features = require("./browser/documentfeatures"), fs = require("fs"), request = require("request"), URL = require("url");

var style = require("./level2/style");

exports.defaultLevel = dom.level3.html;

exports.browserAugmentation = require("./browser/index").browserAugmentation;

exports.windowAugmentation = require("./browser/index").windowAugmentation;

[ "availableDocumentFeatures", "defaultDocumentFeatures", "applyDocumentFeatures" ].forEach(function(propName) {
    exports.__defineGetter__(propName, function() {
        return features[propName];
    });
    exports.__defineSetter__(propName, function(val) {
        return features[propName] = val;
    });
});

exports.debugMode = false;

var createWindow = exports.createWindow = require("./browser/index").createWindow;

exports.__defineGetter__("version", function() {
    return "0.2.15";
});

exports.level = function(level, feature) {
    if (!feature) feature = "core";
    return require("./level" + level + "/" + feature).dom["level" + level][feature];
};

exports.jsdom = function(html, level, options) {
    options = options || {};
    if (typeof level == "string") {
        level = exports.level(level, "html");
    } else {
        level = level || exports.defaultLevel;
    }
    if (!options.url) {
        options.url = module.parent.id === "jsdom" ? module.parent.parent.filename : module.parent.filename;
    }
    var browser = exports.browserAugmentation(level, options), doc = browser.HTMLDocument ? new browser.HTMLDocument(options) : new browser.Document(options);
    if (options.features && options.features.QuerySelector) {
        require("./selectors/index").applyQuerySelector(doc, level);
    }
    features.applyDocumentFeatures(doc, options.features);
    if (typeof html === "undefined" || html === null) {
        doc.write("<html><head></head><body></body></html>");
    } else {
        doc.write(html + "");
    }
    if (doc.close && !options.deferClose) {
        doc.close();
    }
    doc.createWindow = function() {
        if (doc.createWindow) {
            delete doc.createWindow;
        }
        return doc.parentWindow;
    };
    return doc;
};

exports.html = function(html, level, options) {
    html += "";
    var htmlLowered = html.toLowerCase();
    if (!~htmlLowered.indexOf("<body")) {
        html = "<body>" + html + "</body>";
    }
    if (!~htmlLowered.indexOf("<html")) {
        html = "<html>" + html + "</html>";
    }
    return exports.jsdom(html, level, options);
};

exports.jQueryify = exports.jsdom.jQueryify = function(window) {
    if (!window || !window.document) {
        return;
    }
    var args = Array.prototype.slice.call(arguments), callback = typeof args[args.length - 1] === "function" && args.pop(), path, jQueryTag = window.document.createElement("script");
    jQueryTag.className = "jsdom";
    if (args.length > 1 && typeof (args[1] === "string")) {
        path = args[1];
    }
    var features = window.document.implementation._features;
    window.document.implementation.addFeature("FetchExternalResources", [ "script" ]);
    window.document.implementation.addFeature("ProcessExternalResources", [ "script" ]);
    window.document.implementation.addFeature("MutationEvents", [ "1.0" ]);
    jQueryTag.src = path || "http://code.jquery.com/jquery-latest.js";
    window.document.body.appendChild(jQueryTag);
    jQueryTag.onload = function() {
        if (callback) {
            callback(window, window.jQuery);
        }
        window.document.implementation._features = features;
    };
    return window;
};

exports.env = exports.jsdom.env = function() {
    var args = Array.prototype.slice.call(arguments), config = exports.env.processArguments(args), callback = config.done, processHTML = function(err, html) {
        html += "";
        if (err) {
            return callback(err);
        }
        config.scripts = config.scripts || [];
        if (typeof config.scripts === "string") {
            config.scripts = [ config.scripts ];
        }
        config.src = config.src || [];
        if (typeof config.src === "string") {
            config.src = [ config.src ];
        }
        var options = {
            features: config.features || {
                FetchExternalResources: false,
                ProcessExternalResources: false
            },
            url: config.url
        }, window = exports.html(html, null, options).createWindow(), features = JSON.parse(JSON.stringify(window.document.implementation._features)), docsLoaded = 0, totalDocs = config.scripts.length + config.src.length, readyState = null, errors = null;
        if (!window || !window.document) {
            return callback(new Error("JSDOM: a window object could not be created."));
        }
        if (config.document) {
            window.document._referrer = config.document.referrer;
            window.document._cookie = config.document.cookie;
        }
        window.document.implementation.addFeature("FetchExternalResources", [ "script" ]);
        window.document.implementation.addFeature("ProcessExternalResources", [ "script" ]);
        window.document.implementation.addFeature("MutationEvents", [ "1.0" ]);
        var scriptComplete = function() {
            docsLoaded++;
            if (docsLoaded >= totalDocs) {
                window.document.implementation._features = features;
                if (errors) {
                    errors = errors.concat(window.document.errors || []);
                }
                process.nextTick(function() {
                    callback(errors, window);
                });
            }
        };
        if (config.scripts.length > 0 || config.src.length > 0) {
            config.scripts.forEach(function(src) {
                var script = window.document.createElement("script");
                script.className = "jsdom";
                script.onload = function() {
                    scriptComplete();
                };
                script.onerror = function(e) {
                    if (!errors) {
                        errors = [];
                    }
                    errors.push(e.error);
                    scriptComplete();
                };
                script.src = src;
                try {
                    window.document.documentElement.appendChild(script);
                } catch (e) {
                    if (!errors) {
                        errors = [];
                    }
                    errors.push(e.error || e.message);
                    scriptComplete();
                }
            });
            config.src.forEach(function(src) {
                var script = window.document.createElement("script");
                script.onload = function() {
                    process.nextTick(scriptComplete);
                };
                script.onerror = function(e) {
                    if (!errors) {
                        errors = [];
                    }
                    errors.push(e.error || e.message);
                    process.nextTick(scriptComplete);
                };
                script.text = src;
                window.document.documentElement.appendChild(script);
                window.document.documentElement.removeChild(script);
            });
        } else {
            scriptComplete();
        }
    };
    config.html += "";
    if (config.html.indexOf("\n") > 0 || config.html.match(/^\W*</)) {
        processHTML(null, config.html);
    } else {
        var url = URL.parse(config.html);
        config.url = config.url || url.href;
        if (url.hostname) {
            request({
                uri: url,
                encoding: config.encoding || "utf8",
                headers: config.headers || {},
                proxy: config.proxy || null
            }, function(err, request, body) {
                processHTML(err, body);
            });
        } else {
            fs.readFile(config.html, processHTML);
        }
    }
};

exports.env.processArguments = function(args) {
    if (!args || !args.length || args.length < 1) {
        throw new Error("No arguments passed to jsdom.env().");
    }
    var props = {
        html: true,
        done: true,
        scripts: false,
        config: false,
        url: false,
        document: false
    }, propKeys = Object.keys(props), config = {
        code: []
    }, l = args.length;
    if (l === 1) {
        config = args[0];
    } else {
        args.forEach(function(v) {
            var type = typeof v;
            if (!v) {
                return;
            }
            if (type === "string" || v + "" === v) {
                config.html = v;
            } else if (type === "object") {
                if (v.length && v[0]) {
                    config.scripts = v;
                } else {
                    propKeys.forEach(function(req) {
                        if (typeof v[req] !== "undefined" && typeof config[req] === "undefined") {
                            config[req] = v[req];
                            delete v[req];
                        }
                    });
                    config.config = v;
                }
            } else if (type === "function") {
                config.done = v;
            }
        });
    }
    propKeys.forEach(function(req) {
        var required = props[req];
        if (required && typeof config[req] === "undefined") {
            throw new Error("jsdom.env requires a '" + req + "' argument");
        }
    });
    return config;
};