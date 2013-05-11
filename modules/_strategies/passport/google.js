//[] :______________________________
var Proto = require("./index")
  , OpenIDStrategy = require("./openid").Strategy
;//_________________________________
exports = module.exports  = strategy;
exports.Strategy          = Strategy;
exports.OpenIDStrategy    = OpenIDStrategy;


function strategy(options, verify) {
  var _strategy = new Strategy(options, verify);
  return _strategy;
}

function Strategy(options, verify) {
  options = options || {};
  options.providerURL = options.providerURL || "https://www.google.com/accounts/o8/id";
  options.profile     = options.profile === undefined ? true : options.profile;

  var _verify = function (identifier, profile, done) {
    process.nextTick(function () {
      profile.identifier = identifier;
      return done(null, profile);
    });
  };

  OpenIDStrategy.call(this, options, verify || _verify);
  this.name = "google";
}

Proto.inherits(Strategy, OpenIDStrategy);
