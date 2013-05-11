var regex = {
  relPath: /^\.\//,
  absPath: /^\//,
  isPath: /\//g,
  jsFile: /\.js$/,
  dotFile: /^\./,
  singleParam: /^\/([a-z0-9\-:]+)?$/i,
  fileWithExtension: /\.[a-z][a-z0-9]+$/i,
  htmlFile: /\.htm(l)?$/i,
  hasSlash: /\//g,
  multipleSlashes: /\/+/g,
  startsWithSlash: /^\//,
  startsWithSlashes: /^\/+/,
  restrictedView: /^#\/?/,
  layoutView: /^@\/?/,
  startsWithUnderscore: /^_/,
  startOrEndSlash: /(^\/|\/$)/g,
  startOrEndRegex: /(^\^|\$$)/g,
  endsWithSlash: /\/$/,
  regExpChars: /(\^|\$|\\|\.|\*|\+|\?|\(|\)|\[|\]|\{|\}|\||\/)/g,
  controllerAlias: /^\/(.*?)\//,
  headerFilter: /^__([a-z][a-z\-]+[a-z])__$/,
  integer: /^[0-9]+$/,
  "float": /^\d+\.\d+$/,
  number: /^\d+(\.\d+)?$/,
  "null": /^null$/i,
  "boolean": /^(true|false)$/i,
  binary: /^(0|1)$/,
  digit: /^\d$/,
  alpha: /^[a-zA-Z]+$/,
  alpha_spaces: /^[a-zA-Z ]+$/,
  alpha_dashes: /^[a-zA-Z\-]+$/,
  alpha_underscores: /^[a-zA-Z_]+$/,
  alpha_spaces_underscores: /^[a-zA-Z _]+$/,
  alpha_dashes_underscores: /^[a-zA-Z\-_]+$/,
  alpha_lower: /^[a-z]+$/,
  alpha_lower_spaces: /^[a-z ]+$/,
  alpha_lower_dashes: /^[a-z\-]+$/,
  alpha_lower_underscores: /^[a-z_]+$/,
  alpha_lower_spaces_underscores: /^[a-z _]+$/,
  alpha_lower_dashes_underscores: /^[a-z\-_]+$/,
  alpha_upper: /^[A-Z]+$/,
  alpha_upper_spaces: /^[A-Z ]+$/,
  alpha_upper_dashes: /^[A-Z\-]+$/,
  alpha_upper_underscores: /^[A-Z_]+$/,
  alpha_upper_spaces_underscores: /^[A-Z _]+$/,
  alpha_upper_dashes_underscores: /^[A-Z\-_]+$/,
  alnum: /^[a-zA-Z0-9]+$/,
  alnum_spaces: /^[a-zA-Z0-9 ]+$/,
  alnum_dashes: /^[a-zA-Z0-9\-]+$/,
  alnum_underscores: /^[a-zA-Z0-9_]+$/,
  alnum_spaces_underscores: /^[a-zA-Z0-9 _]+$/,
  alnum_dashes_underscores: /^[a-zA-Z0-9\-_]+$/,
  alnum_lower: /^[a-z0-9]+$/,
  alnum_lower_spaces: /^[a-z0-9 ]+$/,
  alnum_lower_dashes: /^[a-z0-9\-]+$/,
  alnum_lower_underscores: /^[a-z0-9_]+$/,
  alnum_lower_spaces_underscores: /^[a-z0-9 _]+$/,
  alnum_lower_dashes_underscores: /^[a-z0-9\-_]+$/,
  alnum_upper: /^[A-Z0-9]+$/,
  alnum_upper_spaces: /^[A-Z0-9 ]+$/,
  alnum_upper_dashes: /^[A-Z0-9\-]+$/,
  alnum_upper_underscores: /^[A-Z0-9_]+$/,
  alnum_upper_spaces_underscores: /^[A-Z0-9 _]+$/,
  alnum_upper_dashes_underscores: /^[A-Z0-9\-_]+$/,
  white_space: /s+/g,
  variable: /^[a-zA-Z][a-zA-Z0-9_]+$/,
  anything: /.+/,
  url: /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:~\+#]*[\w\-\@?\^=%&amp;~\+#])?/,
  email: /[_a-zA-Z0-9\-"'\/]+(\.[_a-zA-Z0-9\-"'\/]+)*@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.(([0-9]{1,3})|([a-zA-Z]{2,3})|(aero|coop|info|museum|name))/,
  password: /^.{6,30}$/,
  md5_hash: /^[a-fA-F0-9]{32}$/
};


exports.validator = {
  range : function(val) {
    val = val ?  val.split("-") : [6,10];

    var _range = RegExp("^.{"+parseInt(val[0],10)+","+parseInt(val[1])+"}$");
    return function(value) {
      return _range.test(value);
    };
  },
  email : function() {
    return function(value) {
      return /[_a-zA-Z0-9\-"'\/]+(\.[_a-zA-Z0-9\-"'\/]+)*@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.(([0-9]{1,3})|([a-zA-Z]{2,3})|(aero|coop|info|museum|name))/.test(value);
    };
  },
  url : function() {
    return function(value) {
      return /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:~\+#]*[\w\-\@?\^=%&amp;~\+#])?/.test(value);
    };
  }
}