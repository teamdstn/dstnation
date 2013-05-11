//[] :____________________
var client  = require('./_proto/client')
;//_________________________________

exports = module.exports = createApplication;

function createApplication() {
  var app = client();
  client.utils.merge(app, client.proto);

  app.init();
  return app;
}

for (var key in client.middleware) {
  Object.defineProperty(exports, key, Object.getOwnPropertyDescriptor(client.middleware, key));
}

exports.createClient  = function() { return createApplication(); };
exports.application   = client.proto;
exports.request       = client.req;
