exports = module.exports = function pointer() {
  return function pointer(req, res, next) {
    !req._body && (req.pause());
    next();
  }
};