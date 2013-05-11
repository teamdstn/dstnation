var pt = require("path")
  , qs = require("querystring")
  //, pager = require(path.join(rootpath, "utils/pager"))
;//=========================================================

exports = module.exports = create;
function merge(a, b) { if (a && b) { for (var key in b) { a[key] = b[key]; } } return a; };

function create(data, options) {
  function table(data, options) {
    this.render(data, options)
  }
  merge(table, proto);
  table.tmlp = "";
  return table;
}

var proto = {};

function getHeaderClass(o, column) {
  var cls = column.cls || "";
  cls += column.sortable === false ? "" : "sortable";
  if (o.view && o.view.sort && (o.view.sort[column.name] || o.view.sort[column.sort])) {
    cls += " sorted-" + (o.view.sort[column.sort] || o.view.sort[column.name]);
  } else {}
  return cls;
}

proto.render = function (o, options) {
  return this.body(o, true) + this.header(o) + this.container(o, options) + this.body(o) + this.footer(o, o.view.url);
};

proto.body = function (o, cast) {
  return cast ? '<table id="' + o.id + '"' + (o.cls ? ' class="' + o.cls + '"' : "") + ">" : "</table>";
};

proto.header = function (o) {
  if (o.columns.length === 0) throw new Error("You must define columns to render a table.");
  var oupt = "<thead><tr>";
  o.columns.forEach(function (column, key) {
    var cls = getHeaderClass(o, column);
    oupt += "<th" + (' class="' + cls + '"') + (column.sort ? ' name="' + column.sort + '"' : column.name ? ' name="' + column.name + '"' : "") + ">";
    oupt += column.label;
    oupt += "</th>";
  });
  oupt += "</tr></thead>";
  return oupt;
};

proto.sortQuery = function (qry, sortBy) {
  if (typeof sortBy === "string") sortBy = [sortBy];
  if (!sortBy || sortBy.length === 0) return qry;
  sortBy.forEach(function (sort) {
    var sortArr = sort.split(",");
    if (sortArr.length === 2) {
      var dir = sortArr[1] === "asc" ? 1 : sortArr[1] === "desc" ? -1 : 0;
      qry = qry.sort(sortArr[0], dir);
    }
  });
  return qry;
};

proto.parseSort = function (sortBy) {
  var options = {};
  if (typeof sortBy === "string") sortBy = [sortBy];
  if (!sortBy || sortBy.length === 0) return options;
  sortBy.forEach(function (sort) {
    var sortArr = sort.split(",");
    if (sortArr.length === 2) {
      options[sortArr[0]] = sortArr[1];
    }
  });
  return options;
};

proto.container = function (o, req) {
  if (o.columns.length === 0) throw new Error("You must define columns to render a data.");
  var oupt = "<tbody>";
  o.data.forEach(function (row) {
    oupt += "<tr>";
    o.columns.forEach(function (column) {
      oupt += "<td>";
      if (column.name in row) {
        if (typeof column.fn === "function") {
          oupt += column.fn(req, row);
        } else {
          oupt += row[column.name];
        }
      } else {
        oupt += "Invalid: " + column.name;
      }
      oupt += "</td>";
    });
    oupt += "</tr>";
  });
  return oupt + "</tbody>";
};

proto.footer = function (o, url) {
  var oupt = "";
  if (o.view && o.view.pager) {
    oupt += pager.render(o.view.from, o.view.limit, o.view.total, url);
  }
  return oupt;
};

/*
var table = {
    id      :'user',
    sort    :true,
    cls     :'table-admin',
    columns :[
      {name:'_id',sort:'username', label:'User', fn:function(req,row){}},
      {name:'fullname', label:'Full Name'},
      {name:'roles', label:'Roles', sortable:false},
      {name:'email', label:'Email', fn:function(req,row){}}
    ],
    data:users,
    view:{
        pager : true
      , from  : from
      , limit : limit
      , total : total
      , url   : req.url
      //, sort:parseSort(sortBy)
    }
};


*/