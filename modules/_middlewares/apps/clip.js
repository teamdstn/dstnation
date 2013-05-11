exports = module.exports = function clip() {
  return function clip(req, res, next) {
    req.cli = {
      ip: getClientIp(req)
    };

    console.log(req.cli)
    next();
  };
};

function getClientIp(req) {
  var ipAddress;
  var forwardedIpsStr = req.header ? req.header("x-forwarded-for") : "";
  if (forwardedIpsStr) {
    var forwardedIps = forwardedIpsStr.split(",");
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
}
