function pagination(schema, options) {
  options || (options = {});
  var defaultLimit  = options.defaultLimit  || 10
    , defaultQuery  = options.defaultQuery  || {}
    , defaultFields = options.defaultFields || []
    , remember      = options.remember      || false
    , defaultPage   = 1
    , currentLimit  = defaultLimit
    , currentQuery  = defaultQuery
    , currentFields = defaultFields
  ;//===============================
  schema.static("paginate", function (opt, fn) {
    if (!fn) {
      fn = opt;
      opt = {};
    }
    var self = this,
      query = opt.query || currentQuery,
      page = opt.page || defaultPage,
      limit = opt.limit || currentLimit,
      fields = opt.fields || currentFields;
    if (remember) {
      opt.query && (currentQuery = opt.query);
      opt.limit && (currentLimit = opt.limit);
      opt.fields && (currentFields = opt.fields);
    }
    this.find(query).skip(limit * (page - 1)).limit(limit).find(function (err, docs) {
      if (err) return fn && fn(err);
      self.count(query, function (err, count) {
        if (err) return fn && fn(err);
        fn && fn(err, docs, count, Math.ceil(count / limit), page);
      });
    });
    return this;
  });
  schema.static("firstPage", function (opt, fn) {
    if (!fn) {
      fn = opt;
      opt = {};
    }
    var query = opt.query || currentQuery,
      limit = opt.limit || currentLimit,
      fields = opt.fields || currentFields;
    this.paginate({
      query: query,
      page: 1,
      limit: limit,
      fields: fields
    }, fn);
    return this;
  });
  schema.static("lastPage", function (opt, fn) {
    if (!fn) {
      fn = opt;
      opt = {};
    }
    var self = this,
      query = opt.query || currentQuery,
      limit = opt.limit || currentLimit,
      fields = opt.fields || currentFields;
    this.count(query, function (err, count) {
      if (err) return fn && fn(err);
      self.paginate({
        query: query,
        page: Math.ceil(count / limit),
        limit: limit,
        fields: fields
      }, fn);
    });
    return this;
  });
}

module.exports = pagination;
