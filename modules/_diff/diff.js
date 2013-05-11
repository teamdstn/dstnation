(function() {
  var root = this;
  var __Array=Array.prototype, __String=String.prototype, __Object=Object.prototype ,keys=Object.keys, toString=__Object.toString ,hasOwnProperty=__Object.hasOwnProperty
    , is = {"arr": __Array.isArray || function (o) { return toString.call(o) == "[object Array]";}, "obj":function (obj) { return obj === Object(obj);}}
    , each = function(o, i) { keys(o).forEach(function (k) { i(o[k], k, o); }); }
    , __e ="object" == typeof exports && exports && ("object"==typeof global && global && global === global.global && (root=global), exports)
    , __i, __nm, __nms, __o
  ;//_________________________________
  each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function (nm) { is[nm.slice(0,3).toLowerCase()] = function (o) { return toString.call(o) == "[object " + nm + "]"; }; })
  ;//__________________________________

  /*!
   * Copyright(c) 2010 TeamDstn Inc.
   * Copyright(c) 2012 TeamDstn.Dustin
   * MIT Licensed
   */

  var $diff = {
      buildView: function(params) {
          var baseTextLines = params.baseTextLines;
          var newTextLines = params.newTextLines;
          var opcodes = params.opcodes;
          var baseTextName = params.baseTextName ? params.baseTextName : "Base Text";
          var newTextName = params.newTextName ? params.newTextName : "New Text";
          var contextSize = params.contextSize;
          var inline = params.viewType == 0 || params.viewType == 1 ? params.viewType : 0;
          if (baseTextLines == null) throw "Cannot build diff view; baseTextLines is not defined.";
          if (newTextLines == null) throw "Cannot build diff view; newTextLines is not defined.";
          if (!opcodes) throw "Canno build diff view; opcodes is not defined.";
          function celt(name, clazz) {
              var e = document.createElement(name);
              e.className = clazz;
              return e;
          }
          function telt(name, text) {
              var e = document.createElement(name);
              e.appendChild(document.createTextNode(text));
              return e;
          }
          function ctelt(name, clazz, text) {
              var e = document.createElement(name);
              e.className = clazz;
              e.appendChild(document.createTextNode(text));
              return e;
          }
          var tdata = document.createElement("thead");
          var node = document.createElement("tr");
          tdata.appendChild(node);
          if (inline) {
              node.appendChild(document.createElement("th"));
              node.appendChild(document.createElement("th"));
              node.appendChild(ctelt("th", "texttitle", baseTextName + " vs. " + newTextName));
          } else {
              node.appendChild(document.createElement("th"));
              node.appendChild(ctelt("th", "texttitle", baseTextName));
              node.appendChild(document.createElement("th"));
              node.appendChild(ctelt("th", "texttitle", newTextName));
          }
          tdata = [ tdata ];
          var rows = [];
          var node2;
          function addCells(row, tidx, tend, textLines, change) {
              if (tidx < tend) {
                  row.appendChild(telt("th", (tidx + 1).toString()));
                  row.appendChild(ctelt("td", change, textLines[tidx].replace(/\t/g, "    ")));
                  return tidx + 1;
              } else {
                  row.appendChild(document.createElement("th"));
                  row.appendChild(celt("td", "empty"));
                  return tidx;
              }
          }
          function addCellsInline(row, tidx, tidx2, textLines, change) {
              row.appendChild(telt("th", tidx == null ? "" : (tidx + 1).toString()));
              row.appendChild(telt("th", tidx2 == null ? "" : (tidx2 + 1).toString()));
              row.appendChild(ctelt("td", change, textLines[tidx != null ? tidx : tidx2].replace(/\t/g, "    ")));
          }
          for (var idx = 0; idx < opcodes.length; idx++) {
              code = opcodes[idx];
              change = code[0];
              var b = code[1];
              var be = code[2];
              var n = code[3];
              var ne = code[4];
              var rowcnt = Math.max(be - b, ne - n);
              var toprows = [];
              var botrows = [];
              for (var i = 0; i < rowcnt; i++) {
                  if (contextSize && opcodes.length > 1 && (idx > 0 && i == contextSize || idx == 0 && i == 0) && change == "equal") {
                      var jump = rowcnt - (idx == 0 ? 1 : 2) * contextSize;
                      if (jump > 1) {
                          toprows.push(node = document.createElement("tr"));
                          b += jump;
                          n += jump;
                          i += jump - 1;
                          node.appendChild(telt("th", "..."));
                          if (!inline) node.appendChild(ctelt("td", "skip", ""));
                          node.appendChild(telt("th", "..."));
                          node.appendChild(ctelt("td", "skip", ""));
                          if (idx + 1 == opcodes.length) {
                              break;
                          } else {
                              continue;
                          }
                      }
                  }
                  toprows.push(node = document.createElement("tr"));
                  if (inline) {
                      if (change == "insert") {
                          addCellsInline(node, null, n++, newTextLines, change);
                      } else if (change == "replace") {
                          botrows.push(node2 = document.createElement("tr"));
                          if (b < be) addCellsInline(node, b++, null, baseTextLines, "delete");
                          if (n < ne) addCellsInline(node2, null, n++, newTextLines, "insert");
                      } else if (change == "delete") {
                          addCellsInline(node, b++, null, baseTextLines, change);
                      } else {
                          addCellsInline(node, b++, n++, baseTextLines, change);
                      }
                  } else {
                      b = addCells(node, b, be, baseTextLines, change);
                      n = addCells(node, n, ne, newTextLines, change);
                  }
              }
              for (var i = 0; i < toprows.length; i++) rows.push(toprows[i]);
              for (var i = 0; i < botrows.length; i++) rows.push(botrows[i]);
          }
          rows.push(node = ctelt("th", "author", "diff view generated by "));
          node.setAttribute("colspan", inline ? 3 : 4);
          node.appendChild(node2 = telt("a", "teamdstn jdiff"));
          node2.setAttribute("href", "http://github.com/teamdstn/jdiff");
          tdata.push(node = document.createElement("tbody"));
          for (var idx in rows) node.appendChild(rows[idx]);
          node = celt("table", "diff" + (inline ? " inlinediff" : ""));
          for (var idx in tdata) node.appendChild(tdata[idx]);
          return node;
      }
  };







  //[exports] :________________________
  __i = $diff, __nm = "$diff", __nms = "edge", __o = root[__nms];
  "function"==typeof define && "object"==typeof define.amd && define.amd ? (root[__nm]=__i,define(function(){return __i})):__e?"object"==typeof module&&module&&module.exports === __e ? (module.exports=__i)[__nm]=__i : __e[__nm] = __i
  :(root[__nms]=root[__nms]||{},root[__nms][__nm]=__i);
  //:root[__nm] = __i
  ;//__________________________________
}).call(this);
