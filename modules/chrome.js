var exec = require('child_process').exec;

var chrome = exports = module.exports = function(options){
  options = options || {};
  !options.url && (options.url = "http://localhost");
  !options.opt && (options.opt = " --app --allow-file-access-from-files --allow-http-access-from-files --disable-web-security --enable-file-cookies --start-maximized ");

  var _cmd = options.opt + options.url;
  return exec("chrome.cmd "+ _cmd, function (error, stdout, stderr) {
    //console.log('stdout: ' + stdout);
   // console.log('stderr: ' + stderr);
    console.log('Run Chrome%s'.cyan, _cmd);
    if (error !== null) {
      console.log('open chrome error: ' + error);
    }
  });
}
