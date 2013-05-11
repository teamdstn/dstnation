var checkArguments, usage;

exports.middleware = function(app, args) {
  var flags, requestFilter, responseFilter, search;
  checkArguments(args);
  if (args.h) {
    usage();
  }
  requestFilter = {};
  responseFilter = {};
  args.url    && (responseFilter.href = args.url)
  args.status && (responseFilter.statusCode = args.status)

  if (args.grep) {
    flags = 'g';
    if (args.i) {
      flags += 'i';
    }
    search = RegExp(args.grep, flags);
    app.log.info("Searching for \"" + search + "\"");
    responseFilter.contains = search;
  }
  return [app.live_logger(requestFilter, responseFilter)];
};

checkArguments = function(args) {
  var prop, val, validArguments, _results;
  validArguments = ['grep', 'url', 'status'];
  _results = [];
  for (prop in args) {
    val = args[prop];
    if (prop.search(/^[a-zA-Z0-9]+$/) >= 0) {
      if (validArguments.indexOf(prop)) {
        _results.push(usage());
      } else {
        _results.push(void 0);
      }
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

usage = function() {
  console.error("usage: app logger --url URL --status STATUS --contains TEXT");
  console.error("--url/--status/--contains can be combined and used multiple time");
  return process.exit(-1);
};

