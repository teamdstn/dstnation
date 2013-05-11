var exec = require('child_process').exec;
var kill = exports = module.exports = function(port, cb){
  exec("FOR /F \"tokens=5 delims= \" %P IN ('netstat -a -n -o ^| findstr :"+port+"') DO TaskKill.exe /F /PID %P", function (error, stdout, stderr) {
    if(stdout.indexOf("SUCCESS:")>-1){
      return cb && cb(null, port);
      //console.log('stdout: ' + stdout);
      //console.log('stderr: ' + stderr);
    }


  });
}