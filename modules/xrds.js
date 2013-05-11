exports.parse = function (data) {

  data = data.replace(/\r|\n/g, "");
  services = [];

  var serviceMatches = data.match(/<Service\s*(priority="\d+")?\s*?>(.*?)<\/Service>/g);
  if (!serviceMatches) {
    return services;
  }
  for (var s = 0, len = serviceMatches.length; s < len; ++s) {
    var service = serviceMatches[s];
    var svcs = [];
    var priorityMatch = /<Service\s*priority="(.*)"\s*?>/g.exec(service);
    var priority = 0;
    if (priorityMatch) {
      priority = parseInt(priorityMatch[1], 10);
    }
    var typeMatch = null;
    var typeRegex = new RegExp("<Type(\\s+.*?)?>(.*?)<\\/Type\\s*?>", "g");
    while (typeMatch = typeRegex.exec(service)) {
      svcs.push({
        priority: priority,
        type: typeMatch[2]
      });
    }
    if (svcs.length == 0) {
      continue;
    }
    var idMatch = /<(Local|Canonical)ID\s*?>(.*?)<\/\1ID\s*?>/g.exec(service);
    if (idMatch) {
      for (var i = 0; i < svcs.length; i++) {
        var svc = svcs[i];
        svc.id = idMatch[2];
      }
    }
    var uriMatch = /<URI(\s+.*?)?>(.*?)<\/URI\s*?>/g.exec(service);
    if (!uriMatch) {
      continue;
    }
    for (var i = 0; i < svcs.length; i++) {
      var svc = svcs[i];
      svc.uri = uriMatch[2];
    }
    var delegateMatch = /<(.*?Delegate)\s*?>(.*)<\/\1\s*?>/g.exec(service);
    if (delegateMatch) {
      svc.delegate = delegateMatch[2];
    }
    services.push.apply(services, svcs);
  }

  services.sort(function (a, b) {
    return a.priority < b.priority ? -1 : a.priority == b.priority ? 0 : 1;
  });

  return services;
};
