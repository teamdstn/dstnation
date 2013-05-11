(function(window, undefined) {
  "use strict";
  var renderer = {};
  var noMatch = /.^/;
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;
  var htmlReg = /&(?!#?\w+;)|<|>|"|'|\//g;
  var unescape = function (code) {
    return code.replace(unescaper, function (match, escape) {
      return escapes[escape];
    });
  };

  var templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g,
    use: /<%#([\s\S]+?)%>/g,
    define: /<%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#%>/g,
    conditional: /<%\?(\?)?\s*([\s\S]*?)\s*%>/g,
    iterate: /<%~\s*(?:%>|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*%>)/g,
    variable: 'it',
    strip: true,
    append: true,
    selfcontained: false
  }

  function _strips (str) {
    return str.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ').replace(/ +/g, ' ');
  }

  function resolveDefs(block, def, settings) {
    settings = settings || templateSettings;
    block = block || "";
    return ((typeof block === 'string') ? block : block.toString()).replace(settings.define || noMatch, function (match, code, assign, value) {
      code = code.indexOf('def.') === 0 ? code.substring(4) : code;
      if (!(code in def)) {
        if (assign === ':') {
          def[code] = _strips(value);
        } else {
          eval("def['" + code + "']=" + _strips(value));
        }
      }
      return '';
    }).replace(settings.use || noMatch, function (match, code) {
      var _eval = eval(code);
      return _eval ? resolveDefs(_eval, def, settings) : _eval;
    });
  }


  var template = function template() {
    var __def = __def || {}, _n;
    return function (text, def, settings, comp) {
      comp = comp || false;
      settings = settings || templateSettings;
      _n = settings.strip ? '' : '\n';
      var source, sid = 0, indv, olddef = __def;
      __def = def || {};
      source = resolveDefs(text, __def, settings);
      __def = olddef;

      source = "__p+='" + source.replace(escaper, function (match) {
        return '\\' + escapes[match];
      }).replace(settings.escape || noMatch, function (match, code) {
        return "'+"+_n+"escape(" + unescape(code) + ")+"+_n+"'";
      }).replace(settings.interpolate || noMatch, function (match, code) {
        return "'+"+_n+"(" + unescape(code) + ")+"+_n+"'";
      }).replace(settings.conditional || noMatch, function (match, condition, code) {
        return condition ? (code ? "';} else if(" + unescape(code) + "){__p+='" : "';}else{__p+='") : (code ? "';if(" + unescape(code) + "){__p+='" : "';}__p+='");
      }).replace(settings.iterate || noMatch, function (match, iterate, vname, iname) {
        if (!iterate) return "';} } __p+='";
        sid += 1;
        indv = iname || "i" + sid;
        iterate = unescape(iterate);
        return "';var arr" + sid + "=" + iterate + ";if(arr" + sid + "){var " + vname + "," + indv + "=-1,l" + sid + "=arr" + sid + ".length-1; while(" + indv + "<l" + sid + "){" + vname + "=arr" + sid + "[" + indv + "+=1];__p+='";
      }).replace(settings.evaluate || noMatch, function (match, code) {
        return "';"+_n+"" + unescape(code) + ""+_n+";__p+='";
      }) + "';"+_n+"";
      if (!settings.variable) source = 'with(obj||{}){'+_n+'' + source + '}'+_n+'';
      source = "var __p='';" + "var print=function(){__p+=Array.prototype.join.call(arguments, '')};"+_n+"" + source + "return __p;"+_n+"";
      //source = settings.strip ? trim(source) : source;
      //source = source.replace(/(^|\r|\n)\t* +| +\t*(\r|\n)/g,' ').replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,'');

      var render = new Function(settings.variable || 'obj', 'func', source);
      if (comp) return render(def, renderer.func);
      var tmpl = function (def) {
          return render.call(this, def, renderer.func);
        };
      tmpl.source = 'function(' + (settings.variable || 'obj') + '){'+_n+'' + source + '}';
      return tmpl;
    }
  }();

  var render = function(text, def, data, settings) {
    //_.defaults(settings || {}, templateSettings);
    settings = settings || templateSettings;
    return data ? template(text, def, settings)(data, settings, true) : template(text, def, settings, true);
  }

  renderer.func = {};
  renderer.render = render;
  renderer.defines = resolveDefs;
  renderer.template = template;
  renderer.templateSettings = templateSettings;

  /**
   * ==============================================================================================
   * alias
   * ==============================================================================================
   */
  renderer.compile  = template;

  var __instance = renderer, __name = "renderer", __nms = "$g";
  var freeExports="object"==typeof exports&&exports&&("object"==typeof global&&global&&global==global.global&&(window=global),exports);
  "function"==typeof define&&"object"==typeof define.amd&&define.amd?(window[__name]=__instance,define(function(){return __instance})):freeExports?"object"==typeof module&&module&&module.exports==freeExports?(module.exports=__instance)[__name]=__instance:freeExports[__name]=__instance
  :(window[__nms]=window[__nms]||{},window[__nms][__name]=__instance);

}(this));
