module.exports = function img(options) {
  return function img($, res, next) {
    next && next();
  };
};