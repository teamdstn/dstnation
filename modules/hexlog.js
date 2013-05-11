/**
 * ==============================================================================================
 * some
 * ==============================================================================================
 */
var hexdig      = "0123456789abcdef";
var isprint     = function(c) { return(c > 0x1f && c < 0x7f); } //var isprint=function(a){return 31<a&&127>a};
var lpad        = function(a,b,c){for(;a.length<b;)a=c+a;return a};
var toHex       = function(a){a=a.toString(16).toUpperCase();return lpad(a,2,"0")};
var reverseStr  = function(b){for(var a="",c=0,d=-b.length;c>d;)a+=b.substr(--c,1);return a};
var __C = { BP_OFFSET: 9, BP_GRAPH: 60, BP_LEN: 80 }



exports = module.exports = function(data) {
  var line = new Buffer(__C.BP_LEN);
  for(var i = 0; i < data.length; i++) {
    var n = i % 16;
    var off;
    if(!n) {
      if(i) process.stdout.write(line.toString());
      line.fill(' ');
      off = i % 0x0ffff;
      line[2] = hexdig[0x0f & (off >> 12)].charCodeAt();
      line[3] = hexdig[0x0f & (off >> 8)].charCodeAt();
      line[4] = hexdig[0x0f & (off >> 4)].charCodeAt();
      line[5] = hexdig[0x0f & off].charCodeAt();
      line[6] = ':'.charCodeAt();
    }

    off = __C.BP_OFFSET + n * 3 + ((n >= 8) ? 1 : 0);
    line[off] = hexdig[0x0f & (data[i] >> 4)].charCodeAt();
    line[off + 1] = hexdig[0x0f & data[i]].charCodeAt();

    off = __C.BP_GRAPH + n + ((n >= 8) ? 1 : 0);

    if(isprint(data[i])) {
      line[__C.BP_GRAPH + n] = data[i];
    } else {
      line[__C.BP_GRAPH + n] = '.'.charCodeAt();
    }
  }
  process.stdout.write(line.toString() + "\n");
}