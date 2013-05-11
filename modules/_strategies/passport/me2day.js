//[] :____________________
var Proto               = require("./index")
  , http                = require("http")
  , crypto              = require("crypto")
  , querystring         = require("querystring")
  , BadRequestError     = Proto.BadRequestError
  , VerificationError   = Proto.VerificationError
;//_________________________________
var __host = "me2day.net";

exports = module.exports  = strategy;
exports.Strategy          = Strategy;


function strategy(options, verify) {
  var _strategy = new Strategy(options, verify);
  return _strategy;
}

function Strategy(options, verify) {
  /*
    userKey: "b41dcf86f3ca2f746d800cfb159b0de5",
    nonce: "dstn",
    callbackURL: "http://teamdstn.iptime.org:3000/auth/me2day/callback"
  */
  options       = options || {};
  options.nonce = options.nonce || "TEAMDSTN"; /*8 1234ABCD*/
  if (!options.userKey) throw new Error("me2day authentication requires an userKey option");

  var _verify = function (identifier, profile, done) {
    process.nextTick(function () {
      profile.identifier = identifier;
      return done(null, profile);
    });
  };

  Proto.call(this, options, verify || _verify);

  var md5       = crypto.createHash("md5");
  this.name     = "me2day";
  this._verify  = verify || _verify;
  this._userKey = options.userKey;
  this._key     = options.sessionKey || "me2day";
  this._autenticationKey = options.nonce + md5.update(options.nonce + options.userKey).digest("hex");
}

Proto.inherits(Strategy, Proto);


Strategy.prototype.authenticate = function (req, options) {
  options = options || {};
  if (!req.session) {
    return this.error(new Error("me2day authentication requires session support"));
  }
  var self = this;
  if (req.query && req.query["token"]) {
  /*{ token: '8a21ec44d19fb4a475de6b3eaa62cf2e',
      result: 'true',
      user_id: 'dustinko',
      user_key: '46539768' }*/



    console.log(req.session)

    /* todo: Session issue;
    if (!req.session[self.user_key]) {
      return self.error(new Error("failed to find token in session"));
    }
    if (req.session[self.user_key]["token"] != req.query["token"]) {
      return self.error(new Error("token is not correct"));
    }


    delete req.session[self._key]["token"];
    if (Object.keys(req.session[self._key]).length == 0) {
      delete req.session[self._key];
    }
    */
    if (!req.query["result"]) {
      return self.error(new Error("the user reject authentication"));
    }

    var token   = req.query["token"];
    var userId  = req.query["user_id"];
    var userKey = req.query["user_key"];


    http.get({host: __host, path: "/api/get_person/" + userId + ".json" }, function (res) {
      res.setEncoding("utf8");
      var data = "";
      res.on("data", function (chunk) {
        data += chunk;
      });
      res.on("end", function () {
        var profile = JSON.parse(data);
        self._verify(userKey, profile, function (err, user, info) {
          if (err) {
            return self.error(err);
          }
          if (!user) {
            return self.fail(info);
          }
          self.success(user, info);
        });
      });
    }).on("error", function (e) {
      return self.error(e);
    });
  } else {

    var query = querystring.stringify({ akey: this._userKey });
    http.get({ host: __host, path: "/api/get_auth_url.json?" + query}, function (res) {
      res.setEncoding("utf8");
      var data = "";
      res.on("data", function (chunk) {
        data += chunk;
      });
      res.on("end", function () {

        var result = JSON.parse(data);
        if (result.url && result.token) {
          if (!req.session[self._key]) {
            req.session[self._key] = {};
          }
          req.session[self._key]["token"] = result.token;
          self.redirect(result.url);
        } else {
          return self.error(result);
        }
      });
    }).on("error", function (e) {
      return self.error(e);
    });
  }
};
