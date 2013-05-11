//#[DEPENDENCE] :________________________________
var $g   = require("edge")
  , argv = $g.cmd("0.0.1", true)
;//#[DEPENDENCE] :________________________________
process.env.NODE_ENV = "sitemap"
;//_______________________________________________
var $m   = $g.modules("partials")
;//_______________________________________________
var _options = {
  parts   : "form img href script style",
  static  : [__dirname, "statics"],
  hosts   : [/* add hostname */],
  def     : {"followRedirect" : false /*, "proxy": "http://189.35.110.83:3128" */},
  beatify : true,
  /* cwalks : require("./statics/map.js")*/
}
_options.account = { /* "name" : "account_name", "pass" : "pasword", "chk" : {"url": "login_state.php" } */ }

$m.partials.sitemapping(/* target hostname */, _options, function(err, doc){
  console.log(err, doc)
});
