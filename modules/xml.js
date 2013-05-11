/*
# Usage
var builder = require('xmlbuilder');
var xml = builder.create('root')
  .ele('xmlbuilder', {'for': 'node-js'})
  .ele('repo', {'type': 'git'}, 'desc')
  .end({ pretty: true});

console.log(xml);
______________________________
  <?xml version="1.0"?>
  <root>
    <xmlbuilder for="node-js">
      <repo type="git">desc</repo>
    </xmlbuilder>
  </root>
______________________________

var root = builder.create('squares');
root.com('f(x) = x^2');
for(var i = 1; i <= 5; i++) {
  var item = root.ele('data');
  item.att('x', i);
  item.att('y', i * i);
}
console.log(root);
______________________________
  <?xml version="1.0"?>
  <squares>
    <!-- f(x) = x^2 -->
    <data x="1" y="1"/>
    <data x="2" y="4"/>
    <data x="3" y="9"/>
    <data x="4" y="16"/>
    <data x="5" y="25"/>
  </squares>
______________________________
*/



(function() {
  var XMLBuilder;
  XMLBuilder = require('./_xml/XMLBuilder');
  module.exports.create = function(name, xmldec, doctype) {
    if (name != null) {
      return new XMLBuilder(name, xmldec, doctype).root();
    } else {
      return new XMLBuilder();
    }
  };

}).call(this);
