var path   = require("path");
var jsdom  = require("./_jvm/jsdom");
var jquery = path.resolve(__dirname, "./_jvm/vender/jquery.js");

exports.window = function(){
  return jsdom.jsdom().createWindow();
}

exports.document = function(str){
  return jsdom.jsdom(str, null, {
    FetchExternalResources   : ['script'],
    ProcessExternalResources : ['script'],
    MutationEvents           : "2.0",
    QuerySelector            : false
  });
}

exports.jqfy = function(wnd, cb){
  wnd = wnd || new exports.window();
  jsdom.jQueryify(wnd, jquery, function() {
    wnd.console = console;
    cb(null, wnd);
  });
}
