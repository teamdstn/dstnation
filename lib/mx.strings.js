(function(root, undefined) {
  'use strict';

  var __string  = String.prototype
    , __trim    = __string.trim
    , __ltrim   = __string.trimLeft
    , __rtrim   = __string.trimRight
    ;

  var parseNumber = function(source) { return source * 1 || 0; };
  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + __s.escapeRegExp(characters) + ']';
  };

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    amp: '&'
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars){ reversedEscapeChars[escapeChars[key]] = key; }

  var __s = {
    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return __s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;
      return String(str).split(substr).length - 1;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = __s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return __s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return __s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      return String(str).replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return __s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c.toUpperCase(); });
    },

    underscored: function(str){
      return __s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return __s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return __s.titleize(String(str).replace(/_/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return __s.capitalize(__s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && __trim) return __trim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && __ltrim) return __ltrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && __rtrim) return __rtrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = __s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (__s.isBlank(str)) return [];
      return __s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return __s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return __s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return __s.pad(str, length, padStr, 'both');
    },

    toNumber: function(str, decimals) {
      if (str == null || str == '') return 0;
      str = String(str);
      var num = parseNumber(parseNumber(str).toFixed(~~decimals));
      return num === 0 && !str.match(/^0+$/) ? Number.NaN : num;
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = tsep || ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    substrR: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    substrRb: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    substrL: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    substrLb: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', '
      lastSeparator = lastSeparator || ' and '
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = __s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return __s.toSentence.apply(__s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæćęèéëêìíïîłńòóöôõøùúüûñçżź",
          to    = "aaaaaaaaceeeeeiiiilnoooooouuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return __s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str) {
      return __s.surround(str, '"');
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    }
  };

  var strRules = {
    singulars:    [[/(m)en$/gi, '$1an'], [/(pe)ople$/gi, '$1rson'], [/(child)ren$/gi, '$1'], [/([ti])a$/gi, '$1um'], [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/gi, '$1$2sis'], [/(hive)s$/gi, '$1'], [/(tive)s$/gi, '$1'], [/(curve)s$/gi, '$1'], [/([lr])ves$/gi, '$1f'], [/([^fo])ves$/gi, '$1fe'], [/([^aeiouy]|qu)ies$/gi, '$1y'], [/(s)eries$/gi, '$1eries'], [/(m)ovies$/gi, '$1ovie'], [/(x|ch|ss|sh)es$/gi, '$1'], [/([m|l])ice$/gi, '$1ouse'], [/(bus)es$/gi, '$1'], [/(o)es$/gi, '$1'], [/(shoe)s$/gi, '$1'], [/(cris|ax|test)es$/gi, '$1is'], [/(octop|vir)i$/gi, '$1us'], [/(alias|status)es$/gi, '$1'], [/^(ox)en/gi, '$1'], [/(vert|ind)ices$/gi, '$1ex'], [/(matr)ices$/gi, '$1ix'], [/(quiz)zes$/gi, '$1'], [/s$/gi, ''] ],
    plurals:      [[/(m)an$/gi, '$1en'], [/(pe)rson$/gi, '$1ople'], [/(child)$/gi, '$1ren'], [/^(ox)$/gi, '$1en'], [/(ax|test)is$/gi, '$1es'], [/(octop|vir)us$/gi, '$1i'], [/(alias|status)$/gi, '$1es'], [/(bu)s$/gi, '$1ses'], [/(buffal|tomat|potat)o$/gi, '$1oes'], [/([ti])um$/gi, '$1a'], [/sis$/gi, 'ses'], [/(?:([^f])fe|([lr])f)$/gi, '$1$2ves'], [/(hive)$/gi, '$1s'], [/([^aeiouy]|qu)y$/gi, '$1ies'], [/(x|ch|ss|sh)$/gi, '$1es'], [/(matr|vert|ind)ix|ex$/gi, '$1ices'], [/([m|l])ouse$/gi, '$1ice'], [/(quiz)$/gi, '$1zes'], [/s$/gi, 's'], [/$/gi, 's'] ],
    uncountables: ['advice', 'energy', 'excretion', 'digestion', 'cooperation', 'health', 'justice', 'labour', 'machinery', 'equipment', 'information', 'pollution', 'sewage', 'paper', 'money', 'species', 'series', 'rain', 'rice', 'fish', 'sheep', 'moose', 'deer', 'news'],
    untitles:     ['and', 'or', 'nor', 'a', 'an', 'the', 'so', 'but', 'to', 'of', 'at', 'by', 'from', 'into', 'on', 'onto', 'off', 'out', 'in', 'over', 'with', 'for']
  }

  function applyRules(str, r) {
    var _rules = strRules[r];
    var rule, found;
    if (!~strRules.uncountables.indexOf(str.toLowerCase())) {
      found = _rules.filter(function (rule) {
        return str.match(rule[0]);
      });
      if (found[0]) return str.replace(found[0][0], found[0][1]);
    }
    return str;
  };

  __s.plural        = function (str) { return applyRules(str, 'plurals');   }
  __s.singular      = function (str) { return applyRules(str, 'singulars'); }
  __s.ordinalize    = function (str) { var num = parseInt(str, 10); if (11 <= num % 100 && num % 100 <= 13) { return str + 'th'; } else { switch (num % 10) { case 1: return str + 'st'; case 2: return str + 'nd'; case 3: return str + 'rd'; default: return str + 'th'; } } }

  __s.randnum       = function(len) { var _range = ["89", 10]; if(len > 2) do { _range[0]+="9"; _range[1]*=10; len--; } while (len>2); return Math.floor(Math.random()*parseInt(_range[0],10) + _range[1]); };
  __s.padzeros      = function(number, length) { var str = '' + number; while (str.length < length) { str = '0' + str; } return str; };
  __s.fisherYates   = function(arr, len) { for (var i = arr.length-1; i > 1  ; i--) { var r = Math.floor(Math.random()*i); var t = arr[i]; arr[i] = arr[r]; arr[r] = t; } return arr.slice(0,len); };
  __s.randInterval  = function(from, to) { return Math.floor(Math.random()*(to-from+1)+from); }


/* "alias" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
  __s.strip    = __s.trim;
  __s.lstrip   = __s.ltrim;
  __s.rstrip   = __s.rtrim;
  __s.center   = __s.lrpad;
  __s.rjust    = __s.lpad;
  __s.ljust    = __s.rpad;
  __s.contains = __s.include;
  __s.q        = __s.quote;
  __s.exports = function() {
    var result = {};
    for (var prop in this) {
      if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
      result[prop] = this[prop];
    }
    return result;
  };

  var __instance = __s, __name = "$s", __nms = "$g";
  __instance.noConflict = function() { root[__nms] = __precedent; return this; };

  var __e ="object"==typeof exports && exports && ("object"==typeof global && global && global === global.global && (root=global), exports);
  //if(__e){ __g.suction(__g, require("./natives"));}
  //else{ root.require=function(){} }

  "function"==typeof define&&"object"==typeof define.amd&&define.amd?(root[__name]=__instance,define(function(){return __instance})):__e?"object"==typeof module&&module&&module.exports === __e ? (module.exports=__instance)[__name]=__instance : __e[__name] = __instance
  :(root[__nms]=root[__nms]||{},root[__nms][__name]=__instance);
  //:root[__name] = __instance;  //mainmodule

}(this));