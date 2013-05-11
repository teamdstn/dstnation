module.exports = function img(options) {
  options = options || {};
  var parser = options.parser || "img[src]";
  return function img(req, res, $, next) {
    console.log($(parser));
    next();
  };
};