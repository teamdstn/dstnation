//[] :____________________
var EventEmitter = require('events').EventEmitter
  , path = require('path')
  , tty = require('tty')
  , basename = path.basename
;//_________________________________
exports = module.exports = new Command();

exports.Command = Command;
exports.Option  = Option;

function Option(flags, description) {
    this.flags = flags;
    this.required = ~flags.indexOf("<");
    this.optional = ~flags.indexOf("[");
    this.bool = !~flags.indexOf("-no-");
    flags = flags.split(/[ ,|]+/);
    if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift();
    this.long = flags.shift();
    this.description = description || "";
}

Option.prototype.name = function() {
    return this.long.replace("--", "").replace("no-", "");
};

Option.prototype.is = function(arg) {
    return arg == this.short || arg == this.long;
};

function Command(name) {
    this.commands = [];
    this.options = [];
    this.args = [];
    this.name = name;
}

Command.prototype.__proto__ = EventEmitter.prototype;

Command.prototype.command = function(name) {
    var args = name.split(/ +/);
    var cmd = new Command(args.shift());
    this.commands.push(cmd);
    cmd.parseExpectedArgs(args);
    cmd.parent = this;
    return cmd;
};

Command.prototype.parseExpectedArgs = function(args) {
    if (!args.length) return;
    var self = this;
    args.forEach(function(arg) {
        switch (arg[0]) {
          case "<":
            self.args.push({
                required: true,
                name: arg.slice(1, -1)
            });
            break;

          case "[":
            self.args.push({
                required: false,
                name: arg.slice(1, -1)
            });
            break;
        }
    });
    return this;
};

Command.prototype.action = function(fn) {
    var self = this;
    this.parent.on(this.name, function(args, unknown) {
        unknown = unknown || [];
        var parsed = self.parseOptions(unknown);
        outputHelpIfNecessary(self, parsed.unknown);
        if (parsed.unknown.length > 0) {
            self.unknownOption(parsed.unknown[0]);
        }
        if (parsed.args.length) args = parsed.args.concat(args);
        self.args.forEach(function(arg, i) {
            if (arg.required && null == args[i]) {
                self.missingArgument(arg.name);
            }
        });
        if (self.args.length) {
            args[self.args.length] = self;
        } else {
            args.push(self);
        }
        fn.apply(this, args);
    });
    return this;
};

Command.prototype.option = function(flags, description, fn, defaultValue) {
    var self = this, option = new Option(flags, description), oname = option.name(), name = camelcase(oname);
    if ("function" != typeof fn) defaultValue = fn, fn = null;
    if (false == option.bool || option.optional || option.required) {
        if (false == option.bool) defaultValue = true;
        if (undefined !== defaultValue) self[name] = defaultValue;
    }
    this.options.push(option);
    this.on(oname, function(val) {
        if (null != val && fn) val = fn(val);
        if ("boolean" == typeof self[name] || "undefined" == typeof self[name]) {
            if (null == val) {
                self[name] = option.bool ? defaultValue || true : false;
            } else {
                self[name] = val;
            }
        } else if (null !== val) {
            self[name] = val;
        }
    });
    return this;
};

Command.prototype.parse = function(argv) {
    this.rawArgs = argv;
    if (!this.name) this.name = basename(argv[1]);
    if (!this._version) {
        try {
            this.version(require("../package.json").version);
        } catch (e) {}
    }
    var parsed = this.parseOptions(this.normalize(argv.slice(2)));
    this.args = parsed.args;
    return this.parseArgs(this.args, parsed.unknown);
};

Command.prototype.normalize = function(args) {
    var ret = [], arg;
    for (var i = 0, len = args.length; i < len; ++i) {
        arg = args[i];
        if (arg.length > 1 && "-" == arg[0] && "-" != arg[1]) {
            arg.slice(1).split("").forEach(function(c) {
                ret.push("-" + c);
            });
        } else {
            ret.push(arg);
        }
    }
    return ret;
};

Command.prototype.parseArgs = function(args, unknown) {
    var cmds = this.commands, len = cmds.length, name;
    if (args.length) {
        name = args[0];
        if (this.listeners(name).length) {
            this.emit(args.shift(), args, unknown);
        } else {
            this.emit("*", args);
        }
    } else {
        outputHelpIfNecessary(this, unknown);
        if (unknown.length > 0) {
            this.unknownOption(unknown[0]);
        }
    }
    return this;
};

Command.prototype.optionFor = function(arg) {
    for (var i = 0, len = this.options.length; i < len; ++i) {
        if (this.options[i].is(arg)) {
            return this.options[i];
        }
    }
};

Command.prototype.parseOptions = function(argv) {
    var args = [], len = argv.length, literal, option, arg;
    var unknownOptions = [];
    for (var i = 0; i < len; ++i) {
        arg = argv[i];
        if ("--" == arg) {
            literal = true;
            continue;
        }
        if (literal) {
            args.push(arg);
            continue;
        }
        option = this.optionFor(arg);
        if (option) {
            if (option.required) {
                arg = argv[++i];
                if (null == arg) return this.optionMissingArgument(option);
                if ("-" == arg[0]) return this.optionMissingArgument(option, arg);
                this.emit(option.name(), arg);
            } else if (option.optional) {
                arg = argv[i + 1];
                if (null == arg || "-" == arg[0]) {
                    arg = null;
                } else {
                    ++i;
                }
                this.emit(option.name(), arg);
            } else {
                this.emit(option.name());
            }
            continue;
        }
        if (arg.length > 1 && "-" == arg[0]) {
            unknownOptions.push(arg);
            if (argv[i + 1] && "-" != argv[i + 1][0]) {
                unknownOptions.push(argv[++i]);
            }
            continue;
        }
        args.push(arg);
    }
    return {
        args: args,
        unknown: unknownOptions
    };
};

Command.prototype.missingArgument = function(name) {
    console.error();
    console.error("  error: missing required argument `%s'", name);
    console.error();
    process.exit(1);
};

Command.prototype.optionMissingArgument = function(option, flag) {
    console.error();
    if (flag) {
        console.error("  error: option `%s' argument missing, got `%s'", option.flags, flag);
    } else {
        console.error("  error: option `%s' argument missing", option.flags);
    }
    console.error();
    process.exit(1);
};

Command.prototype.unknownOption = function(flag) {
    console.error();
    console.error("  error: unknown option `%s'", flag);
    console.error();
    process.exit(1);
};

Command.prototype.version = function(str, flags) {
    if (0 == arguments.length) return this._version;
    this._version = str;
    flags = flags || "-V, --version";
    this.option(flags, "output the version number");
    this.on("version", function() {
        console.log(str);
        process.exit(0);
    });
    return this;
};

Command.prototype.description = function(str) {
    if (0 == arguments.length) return this._description;
    this._description = str;
    return this;
};

Command.prototype.usage = function(str) {
    var args = this.args.map(function(arg) {
        return arg.required ? "<" + arg.name + ">" : "[" + arg.name + "]";
    });
    var usage = "[options" + (this.commands.length ? "] [command" : "") + "]" + (this.args.length ? " " + args : "");
    if (0 == arguments.length) return this._usage || usage;
    this._usage = str;
    return this;
};

Command.prototype.largestOptionLength = function() {
    return this.options.reduce(function(max, option) {
        return Math.max(max, option.flags.length);
    }, 0);
};

Command.prototype.optionHelp = function() {
    var width = this.largestOptionLength();
    return [ pad("-h, --help", width) + "  " + "output usage information" ].concat(this.options.map(function(option) {
        return pad(option.flags, width) + "  " + option.description;
    })).join("\n");
};

Command.prototype.commandHelp = function() {
    if (!this.commands.length) return "";
    return [ "", "  Commands:", "", this.commands.map(function(cmd) {
        var args = cmd.args.map(function(arg) {
            return arg.required ? "<" + arg.name + ">" : "[" + arg.name + "]";
        }).join(" ");
        return cmd.name + (cmd.options.length ? " [options]" : "") + " " + args + (cmd.description() ? "\n" + cmd.description() : "");
    }).join("\n\n").replace(/^/gm, "    "), "" ].join("\n");
};

Command.prototype.helpInformation = function() {
    return [ "", "  Usage: " + this.name + " " + this.usage(), "" + this.commandHelp(), "  Options:", "", "" + this.optionHelp().replace(/^/gm, "    "), "", "" ].join("\n");
};

Command.prototype.promptForNumber = function(str, fn) {
    var self = this;
    this.promptSingleLine(str, function parseNumber(val) {
        val = Number(val);
        if (isNaN(val)) return self.promptSingleLine(str + "(must be a number) ", parseNumber);
        fn(val);
    });
};

Command.prototype.promptForDate = function(str, fn) {
    var self = this;
    this.promptSingleLine(str, function parseDate(val) {
        val = new Date(val);
        if (isNaN(val.getTime())) return self.promptSingleLine(str + "(must be a date) ", parseDate);
        fn(val);
    });
};

Command.prototype.promptSingleLine = function(str, fn) {
    if ("function" == typeof arguments[2]) {
        return this["promptFor" + (fn.name || fn)](str, arguments[2]);
    }
    process.stdout.write(str);
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", function(val) {
        fn(val.trim());
    }).resume();
};

Command.prototype.promptMultiLine = function(str, fn) {
    var buf = [];
    console.log(str);
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", function(val) {
        if ("\n" == val || "\r\n" == val) {
            process.stdin.removeAllListeners("data");
            fn(buf.join("\n"));
        } else {
            buf.push(val.trimRight());
        }
    }).resume();
};

Command.prototype.prompt = function(str, fn) {
    var self = this;
    if ("string" == typeof str) {
        if (/ $/.test(str)) return this.promptSingleLine.apply(this, arguments);
        this.promptMultiLine(str, fn);
    } else {
        var keys = Object.keys(str), obj = {};
        function next() {
            var key = keys.shift(), label = str[key];
            if (!key) return fn(obj);
            self.prompt(label, function(val) {
                obj[key] = val;
                next();
            });
        }
        next();
    }
};

Command.prototype.password = function(str, mask, fn) {
    var self = this, buf = "";
    if ("function" == typeof mask) {
        fn = mask;
        mask = "";
    }
    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdout.write(str);
    process.stdin.on("keypress", function(c, key) {
        if (key && "enter" == key.name) {
            console.log();
            process.stdin.removeAllListeners("keypress");
            process.stdin.setRawMode(false);
            if (!buf.trim().length) return self.password(str, mask, fn);
            fn(buf);
            return;
        }
        if (key && key.ctrl && "c" == key.name) {
            console.log("%s", buf);
            process.exit();
        }
        process.stdout.write(mask);
        buf += c;
    }).resume();
};

Command.prototype.confirm = function(str, fn, verbose) {
    var self = this;
    this.prompt(str, function(ok) {
        if (!ok.trim()) {
            if (!verbose) str += "(yes or no) ";
            return self.confirm(str, fn, true);
        }
        fn(parseBool(ok));
    });
};

Command.prototype.choose = function(list, index, fn) {
    var self = this, hasDefault = "number" == typeof index;
    if (!hasDefault) {
        fn = index;
        index = null;
    }
    list.forEach(function(item, i) {
        if (hasDefault && i == index) {
            console.log("* %d) %s", i + 1, item);
        } else {
            console.log("  %d) %s", i + 1, item);
        }
    });
    function again() {
        self.prompt("  : ", function(val) {
            val = parseInt(val, 10) - 1;
            if (hasDefault && isNaN(val)) val = index;
            if (null == list[val]) {
                again();
            } else {
                fn(val, list[val]);
            }
        });
    }
    again();
};

function camelcase(flag) {
    return flag.split("-").reduce(function(str, word) {
        return str + word[0].toUpperCase() + word.slice(1);
    });
}

function parseBool(str) {
    return /^y|yes|ok|true$/i.test(str);
}

function pad(str, width) {
    var len = Math.max(0, width - str.length);
    return str + Array(len + 1).join(" ");
}

function outputHelpIfNecessary(cmd, options) {
    options = options || [];
    for (var i = 0; i < options.length; i++) {
        if (options[i] == "--help" || options[i] == "-h") {
            process.stdout.write(cmd.helpInformation());
            cmd.emit("--help");
            process.exit(0);
        }
    }
}