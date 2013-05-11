;//[] :____________________
var actions = require("../../_context/passport/actions")
  , Context = require("../../_context/passport/context")
;//_________________________________
module.exports = function authenticate(name, options, callback) {

  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || {};
  if (!Array.isArray(name)) {
    name = [name];
  }
  return function authenticate(req, res, next) {
    var passport = this;
    var failures = [];

    function allFailed() {
      if (callback) {
        if (failures.length == 1) {
          return callback(null, false, failures[0].challenge, failures[0].status);
        } else {
          var challenges = failures.map(function (f) {
            return f.challenge;
          });
          var statuses = failures.map(function (f) {
            return f.status;
          });
          return callback(null, false, challenges, statuses);
        }
      }
      var failure = failures[0] || {},
        challenge = failure.challenge || {};
      if (options.failureFlash) {
        var flash = options.failureFlash;
        if (typeof flash == "string") {
          flash = {
            type: "error",
            message: flash
          };
        }
        flash.type = flash.type || "error";
        var type = flash.type || challenge.type || "error";
        var msg = flash.message || challenge.message || challenge;
        if (typeof msg == "string") {
          req.flash(type, msg);
        }
      }
      if (options.failureRedirect) {
        return res.redirect(options.failureRedirect);
      }
      var rchallenge = [],
        rstatus;
      for (var j = 0, len = failures.length; j < len; j++) {
        var failure = failures[j],
          challenge = failure.challenge || {},
          status = failure.status;
        if (typeof challenge == "number") {
          status = challenge;
          challenge = null;
        }
        rstatus = rstatus || status;
        if (typeof challenge == "string") {
          rchallenge.push(challenge);
        }
      }
      res.statusCode = rstatus || 401;
      if (rchallenge.length) {
        res.setHeader("WWW-Authenticate", rchallenge);
      }
      res.end("Unauthorized");
    }
    (function attempt(i) {
      var delegate = {};
      delegate.success = function (user, info) {
        if (callback) {
          return callback(null, user, info);
        }
        info = info || {};
        if (options.successFlash) {
          var flash = options.successFlash;
          if (typeof flash == "string") {
            flash = {
              type: "success",
              message: flash
            };
          }
          flash.type = flash.type || "success";
          var type = flash.type || info.type || "success";
          var msg = flash.message || info.message || info;
          if (typeof msg == "string") {
            req.flash(type, msg);
          }
        }
        if (options.assignProperty) {
          req[options.assignProperty] = user;
          return next();
        }
        req.logIn(user, options, function (err) {
          if (err) {
            return next(err);
          }
          if (options.authInfo || options.authInfo === undefined) {
            passport.transformAuthInfo(info, function (err, tinfo) {
              if (err) {
                return next(err);
              }
              req.authInfo = tinfo;
              complete();
            });
          } else {
            complete();
          }

          function complete() {
            if (options.successReturnToOrRedirect) {
              var url = options.successReturnToOrRedirect;
              if (req.session && req.session.returnTo) {
                url = req.session.returnTo;
                delete req.session.returnTo;
              }
              return res.redirect(url);
            }
            if (options.successRedirect) {
              return res.redirect(options.successRedirect);
            }
            next();
          }
        });
      };

      delegate.fail = function (challenge, status) {
        failures.push({
          challenge: challenge,
          status: status
        });
        attempt(i + 1);
      };

      var layer = name[i];
      if (!layer) {
        return allFailed();
      }
      var prototype = passport._strategy(layer);
      if (!prototype) {
        return next(new Error("no strategy registered under name: " + layer));
      }
      var strategy = Object.create(prototype);
      var context = new Context(delegate, req, res, next);
      augment(strategy, actions, context);
      strategy.authenticate(req, options);
    })(0);
  };
};

function augment(strategy, actions, ctx) {
  for (var method in actions) {
    strategy[method] = actions[method].bind(ctx);
  }
}
