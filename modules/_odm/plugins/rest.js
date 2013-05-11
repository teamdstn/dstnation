function dataToObjects(data) {
  if (!data) return null;
  if (data instanceof Array) {
    return data.map(function (doc) {
      return doc.toObject();
    });
  }
  return data.toObject();
}

function rest(schema, options) {
  options = options || {};
  var pagination = options.pagination || {};
  schema.static({
    get: get,
    post: update,
    put: update,
    del: del,
    search: search,
    bulk: search
  });

  if (!schema.statics.paginate) {
    schema.plugin(require("./pagination"), pagination);
  }

  function get(id, fn) {
    this.findById(id, function (err, doc) {
      fn(err, dataToObjects(doc));
    });
    return this;
  }

  function update(id, data, fn) {
    typeof data === "function" && (fn = data, id = data, id = data.id||data._id);
    if(!id) return console.error("[31m%s [0m: [31m[1m%s [0m", "E", "ID.E");
    var query = {_id:id};
    data._id && (delete data._id);
    this.update(query, data, {
      upsert: true
    }, function (err, count) {
      if (err || !count) return fn(err, false);
      fn(null, true);
    });
    return this;
  }

  function del(id, fn) {
    this.findById(id, function (err, doc) {
      if (err || !doc) return fn(err, false);
      doc.remove(function (err, doc) {
        if (err) return fn(err, false);
        fn(null, true);
      });
    });
    return this;
  }

  function search(query, fn) {
    var query = query || {
      limit: 10,
      page: 1
    },
      limit = query.limit,
      page = query.page;
    delete query.limit;
    delete query.page;
    console.log(query, limit, page);
    this.paginate({
      query: query,
      limit: limit,
      page: page
    }, function (err, docs) {
      fn(err, dataToObjects(docs));
    });
    return this;
  }
}

module.exports = rest;
