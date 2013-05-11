var url = require("url")
  , qs  = require("querystring")
;//==================================

exports = module.exports = {
  render: function (skip, limit, total, path) {
    var totalPages = Math.ceil(total / limit) + 1;
    var current = skip / limit + 1;
    var oupt = ""
      , wrapper = "<div class='pager'>"
      , start
      , finish
    ;//========================================
    var selectedClass = "page-selected";
    var visible = 5;
    var i;
    var totalhrefs = 0;
    oupt += pageSpan(current);
    var _forward = current < visible ? visible - current : 0;
    for (i = current + 1; i < current + visible + _forward && i < totalPages; i++) {

      start = (i - 1) * limit + 1;
      oupt += href(path, start, limit, i);
    }

    if (current < totalPages - 1) {
      oupt += href(path, skip + limit + 1, limit, ">");
      var lastPageStart = (totalPages - 2) * limit + 1;
      oupt += href(path, lastPageStart, limit, ">>");
    }

    var _backward = totalPages - current < visible ? visible - (totalPages - current) : 0;
    for (i = current - 1; i > current - visible - _backward && i > 0; i--) {
      start = (i - 1) * limit + 1;
      oupt = href(path, start, limit, i) + oupt;
    }

    if (current > 1) {
      oupt = href(path, skip - limit + 1, limit, "<") + oupt;
      oupt = href(path, 1, limit, "<<") + oupt;
    }

    oupt += "&nbsp;Go To: <input id='pagerGoto' type='text' name='skip' value='' class='pager-page' title='Go to a specific start point, type and enter ...' />";
    oupt += "<span style='float: right'>" + (skip + 1) + " to " + (skip + limit) + " of " + total + "</span></div>";
    if (totalPages > 2) {
      return wrapper + oupt;
    } else {
      return "";
    }
  }
};

function href(path, skip, limit, page) {
  var pathUrl = url.parse(path, true);
  pathUrl.query.limit = limit;
  pathUrl.query.from = skip;
  qs.escape = function (esc) {
    return esc;
  };
  var fullPath = pathUrl.pathname + "?" + qs.stringify(pathUrl.query);
  return "<a class='pager-page' href='" + fullPath + "'>" + page + "</a>";
}

function pageSpan(page) {
  return "<span class='pager-page'>" + page + "</span>";
}
