var log = require("./logger").create("reporter");

var MultiReporter = require("./_reporters/Multi");
function ucFirst(str) { return str.charAt(0).toUpperCase() + str.substr(1); };

var createErrorFormatter = function(basePath, urlRoot) {
    var URL_REGEXP = new RegExp("http:\\/\\/[^\\/]*" + urlRoot.replace(/\//g, "\\/") + "(base|absolute)([^\\?\\s]*)(\\?[0-9]*)?", "g");
    return function(msg, indentation) {
        msg = msg.replace(URL_REGEXP, function(full, prefix, path) {
            if (prefix === "base") {
                return basePath + path;
            } else if (prefix === "absolute") {
                return path;
            }
        });
        if (indentation) {
            msg = indentation + msg.replace(/\n/g, "\n" + indentation);
        }
        return msg + "\n";
    };
};

var createReporters = function(names, config) {
    var errorFormatter = createErrorFormatter(config.basePath, config.urlRoot);
    var multiReporter = new MultiReporter();
    names.forEach(function(name) {
        var Reporter;
        if (name === "junit") {
            Reporter = exports.JUnit;
            return multiReporter.reporters.push(new Reporter(errorFormatter, config.junitReporter.outputFile, config.junitReporter.suite));
        };
        Reporter = exports[ucFirst(name) + (config.colors ? "Color" : "")];
        if (Reporter) {
            var reporter = new Reporter(errorFormatter, config.reportSlowerThan);
            return multiReporter.reporters.push(reporter);
        };

        log.error('Reporter "%s" does not exist!', name);
    });
    return multiReporter;
};

exports.Dots            = require("./_reporters/Dots");
exports.Progress        = require("./_reporters/Progress");
exports.DotsColor       = require("./_reporters/DotsColor");
exports.ProgressColor   = require("./_reporters/ProgressColor");
exports.JUnit           = require("./_reporters/JUnit");
exports.createReporters = createReporters;