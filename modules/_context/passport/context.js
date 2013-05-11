function Context(delegate, req, res, next) {
  this.delegate = delegate;
  this.req  = req;
  this.res  = res;
  this.next = next;
}

module.exports = Context;
