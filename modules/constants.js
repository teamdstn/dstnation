var IS_IE                   = eval("/*@cc_on!@*/false");
var FILE_STORAGE_TOKEN      = "INJECT";
var LSCACHE_SCHEMA_VERSION  = 1;
var LSCACHE_SCHEMA_VERSION_STRING = "!version";
var LSCACHE_APP_KEY_STRING  = "!appCacheKey";
var AMD_DEFERRED            = "###DEFERRED###";
var NAMESPACE               = "Inject";
var FILE_SUFFIX_REGEX       = /.*?\.(js|txt)(\?.*)?$/;
var BASIC_FILE_SUFFIX       = ".js";
var HOST_PREFIX_REGEX       = /^https?:\/\//;
var HOST_SUFFIX_REGEX       = /^(.*?)(\/.*|$)/;
var RESPONSE_SLICER_REGEX   = /^(.+?)[\s]+([\w\W]+?)[\s]+([\w\W]+)$/m;
var FUNCTION_REGEX          = /^[\s\(]*function[^\(]*\(([^)]*)\)/;
var FUNCTION_NEWLINES_REGEX = /\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g;
var FUNCTION_BODY_REGEX     = /[\w\W]*?\{([\w\W]*)\}/m;
var WHITESPACE_REGEX        = /\s+/g;
var REQUIRE_REGEX           = /(?:^|[^\w\$_.\(])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g;
var DEFINE_EXTRACTION_REGEX = /(?:^|[\s]+)define[\s]*\([\s]*((?:"|')\S+(?:"|'))?,?[\s]*(?:\[([\w\W]+)\])?/g;
var BUILTINS = { require : true, exports : true, module  : true };
var BUILTINS_REPLACE_REGEX  = /[\s]|"|'|(require)|(exports)|(module)/g;
var GREEDY_REQUIRE_REXEX    = /require.*/;
var JS_COMMENTS_REGEX       = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var RELATIVE_PATH_REGEX     = /^(\.{1,2}\/).+/;
var ABSOLUTE_PATH_REGEX     = /^([A-Za-z]+:)?\/\//;
var HAS_LOCAL_STORAGE = function () {
  try {
    localStorage.setItem("injectLStest", "ok");
    localStorage.removeItem("injectLStest");
    return true;
  } catch (err) {
    return false;
  }
}();
