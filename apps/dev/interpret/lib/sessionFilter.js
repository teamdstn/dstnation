var $u = require("./utils");
exports.matches = function(filter, session) {

  function check(b,a){if($u.isRegExp(a)){if(0<=b.search(a))return!0}else if($u.isString(a)){if(0<=b.search(a))return!0}else if($u.isNumber(a)){if(0<=b.toString().search(a.toString()))return!0}else if($u.isFunction(a)&&a(b))return!0};

  var content, contentType, key, match, regex, s, t, test, _i, _j, _len, _len1, _ref;
  if (!filter) {
    return true;
  }
  if (filter === true) {
    return true;
  }
  if ($u.isFunction(filter)) {
    match = filter(session) || false;
    return match;
  }
  if (!(Object.keys(filter).length > 0)) {
    return true;
  }
  if (filter.contains && session.headers) {
    contentType = session.headers['content-type'] || '';
    if (session.body && (contentType.search(/^(image|audio|video)/) < 0)) {
      content = '';
      if ($u.isRegExp(filter.contains)) {
        regex = filter.contains;
      } else {
        regex = new RegExp(filter.contains, 'g');
      }
      _ref = session.body;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        content += s.toString('utf-8');
      }
      if (content.search(regex) >= 0) {
        return true;
      }
    } else {
      return false;
    }
  }
  match = false;
  for (key in filter) {
    test = filter[key];
    if (session[key]) {
      if ($u.isArray(test)) {
        for (_j = 0, _len1 = test.length; _j < _len1; _j++) {
          t = test[_j];
          if (check(session[key], t)) {
            match = true;
            break;
          }
        }
      } else if (check(session[key], test)) {
        match = true;
      }
    }
  }
  return match;
};
