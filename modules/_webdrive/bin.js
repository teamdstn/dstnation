#!/usr/bin/env node
//[] :____________________
var net       = require('net')
  , repl      = require('repl')
  , assert    = require('assert')
  , wd        = require('../webdrive')
;//_______________________

var startRepl = function() {
    var _rpl = repl.start("(wd): ");
    _rpl.context.assert = assert;
    _rpl.context.wd = wd;
    _rpl.context.help = function() {
        console.log("WD - Shell.");
        console.log("Access the webdriver object via the object: 'wd'");
    };
    net.createServer(function(socket) {
        connections += 1;
        repl.start("(wd): ", socket);
    }).listen(process.platform === "win32" ? "\\\\.\\pipe\\node-repl-sock" : "/tmp/node-repl-sock");
};

if (process.argv[2] == "shell") {
    startRepl();
}