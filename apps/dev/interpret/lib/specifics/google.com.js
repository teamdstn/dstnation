module.exports = function(app) {
  var replace, ua;
  ua = function(req, res, next) {
    req.headers['user-agent'] = "GoogleBotZ";
    res.on('headers', function(headers) {
      return headers['server'] = "Apache";
    });
    return next();
  };
  replace = function(string, req, res) {
    if (res.headers['content-type'].match('html')) {
      return string.replace(/Lucky/gi, 'Unlucky');
    } else {
      return false;
    }
  };
  return [ua, app.replace(replace)];
};
