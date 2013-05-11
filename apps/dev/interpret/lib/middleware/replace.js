var sessionFilter = require('../sessionFilter');

module.exports = function(replacer, filter) {
  filter || (filter = {});
  return function(req, res, next) {
    var end, write, writeHead;
    if (!sessionFilter.matches(filter.request, req)) {
      return next();
    }
    writeHead = res.writeHead;
    write = res.write;
    end = res.end;
    res.writeHead = function(status, h) {};
    res.write = function(data) {};
    res.end = function(data) {};
    res.on('body', function() {
      var content, replacedContent;
      if (res.isBinary) {
        res.headers['content-length'] = res.length;
        writeHead.call(res, res.statusCode, res.headers);
        if (res.length > 0) {
          write.call(res, res.body);
        }
        return end.call(res);
      } else {
        content = res.body.toString('utf-8');
        replacedContent = replacer(content, req, res);
        content = replacedContent || content;
        res.headers['content-length'] = content.length;
        delete res.headers['content-encoding'];
        writeHead.call(res, res.statusCode, res.headers);
        return end.call(res, content);
      }
    });
    return next();
  };
};

