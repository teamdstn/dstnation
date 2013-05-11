//[] :______________________________
var Proto = require("./index")
;//_________________________________
exports.Strategy = Strategy;

function Strategy(options, verify) {
    if (typeof options == "function") {
        verify = options;
        options = {};
    }
    if (!verify) throw new Error("HTTP Basic authentication strategy requires a verify function");
    Proto.call(this);
    this.name = "basic";
    this._verify = verify;
    this._realm = options.realm || "Users";
}

Proto.inherits(Strategy, Proto);

Strategy.prototype.authenticate = function(req) {
    var authorization = req.headers["authorization"];
    if (!authorization) {
        return this.fail(this._challenge());
    }
    var parts = authorization.split(" ");
    if (parts.length < 2) {
        return this.fail(400);
    }
    var scheme = parts[0], credentials = new Buffer(parts[1], "base64").toString().split(":");
    if (!/Basic/i.test(scheme)) {
        return this.fail(this._challenge());
    }
    var userid = credentials[0];
    var password = credentials[1];
    if (!userid || !password) {
        return this.fail(400);
    }
    var self = this;
    this._verify(userid, password, function(err, user) {
        if (err) {
            return self.error(err);
        }
        if (!user) {
            return self.fail(self._challenge());
        }
        self.success(user);
    });
};

Strategy.prototype._challenge = function() {
    return 'Basic realm="' + this._realm + '"';
};
