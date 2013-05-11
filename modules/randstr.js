
var __char = {
  "W": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "w": "abcdefghijklmnopqrstuvwxyz",
  "n": "0123456789"
}

module.exports = function(str, n, o){
  str = str || "", n = (n || 8)-str.length;
  var __c = __char["W"], len =__c.length;
  for( var i=0; i < n; i++ )
    str += __c.charAt(Math.floor(Math.random() * __c.length));
  return str+$g.random(10,99);
};

