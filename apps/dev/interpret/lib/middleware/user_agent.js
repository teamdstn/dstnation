var checkArguments, usage;

exports.middleware = function(app, args) {
  var requestFilter, user_agent;
  checkArguments(args);
  user_agent = args._.shift();
  if (args.url) {
    requestFilter = { href: args.url };
  }
  return [app.logger(), app.user_agent(user_agent, requestFilter)];
};

usage = function() {
  console.error("usage: user_agent UA_STRING [--url site.com]");
  return process.exit(-1);
};

checkArguments = function(args) {
  if (!(args._.length > 0)) {
    return usage();
  }
};
