var __env = process.env.NODE_ENV = "test"
;//─────────────────
var $g  = require("./lib/edge")
  , $a  = $g.cmd("0.0.1", true)
  , __pkg = "sitemap", __nms = "admin", __nm = "app:main", mt = "", ntr = "\r\n"
;//─────────────────
var fs    = require('fs')
  , $m    = $g.modules("conf express webdrive jvm streams passport orm")
  , $n    = $g.modules("vars", true)
;//─────────────────
$g.patches($m);
;//〓〓〓〓〓〓〓〓〓〓
var app = $m.express()
  , wd  = $m.webdrive.remote()
;//─────────────────
function configure(nm, nms){
}

var _chrome = {
  browserName       : "chrome",
  javascriptEnabled : true,
  platform          : "ANY",
  "chrome.switches" : ["--app", "--disable-popup-blocking", "--allow-file-access-from-files", "--allow-http-access-from-files", "--enable-file-cookies"],
  "opera.arguments" : "-nowin"
};


app.excute(3e3, function (err) {
  console.log(app.model);
  var _url = "http://localhost:" + app.get("port");
  console.log("LSTN : [32m[1m%s [0m", _url);
  return;

  var $b = wd.chain().init(_chrome).get(_url);

});
