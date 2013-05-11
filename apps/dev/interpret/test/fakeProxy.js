/*
Uses latest & greatest NodeJS version (0.7.5), may cause external libraries
like Mu to not work because of a changed package (sys was renamed to util)
Fix manually by going into ./node_modules/mu and replacing all instances of
require('sys') with require('util'). Should just run under earlier versions
of Node as long as you replace the below require('util') with require('sys').

Download dependencies using 'npm install'

Run using node mock.js <port (optional)>

*/

var util = require("util"),
    http = require("http"),
    url  = require("url"),
    fileSystem = require('fs'),
    path = require('path'),
    dateFormat = require('./dateformat.js'), // download from https://github.com/felixge/node-dateformat
    Mu = require('mu');

var responseDir = path.join(__dirname, 'response')
Mu.root = responseDir;

// pre-compile the templates.
// https://github.com/raycmorgan/Mu/issues/14
fileSystem.readdir(responseDir, function(err, files) {
  files.forEach(function(file) {
    console.log('Compiling template file ' + file)
    Mu.compile(file, function(err, parsed) {
        if (err) { throw err; }
    });
  });
});

// see http://blog.stevenlevithan.com/archives/date-time-format for formatting options.
function formatDate(theDate) {
  return dateFormat(theDate, "yyyy'-'mm'-'dd'T'HH:MM:sso")
}

var responseMap = [
  // fixed pattern test
  {pattern:/\btest\?test\=true$/, response:{file: "test-ok.xml"}},
  // dynamic pattern test, the three parameters it matches on can be anywhere in the path
  {pattern:/\bmobile-api-planner\?(?=.*hslAllowed=true)(?=.*fromStation=ASD)(?=.*toStation=RTD)/, response: {file: "ams-rtd-fyra.xml"}},
  // example with dynamic response parameters
  {pattern:/\bmobile-api-planner\?(?=.*fromStation=MDB)(?=.*toStation=UT)/,
    response:{
      file: "mdb-ut-trip-cancelled.xml",
      params: {departure: function() {
        var now = new Date();
        return formatDate(now.setMinutes(now.getMinutes() + 32));
      }}
    }
  }
];

function findResponseFor(path) {
  var result = null;
  responseMap.forEach(function(candidate) {
    if (path.match(candidate.pattern)) {
      result = candidate.response;
      return;
    }
  })
  return result;
}

function writeFileToResponse(responseFile, response) {
  response.writeHead(200, {"Content-Type": "application/xml"});
  Mu.render(responseFile.file, responseFile.params)
    .addListener('data', function(chunk) {
      response.write(chunk)
    })
    .addListener('end', function() {
      response.end()
    });
}

function writeWebserviceToResponse(request, response) {
  var params = url.parse(request.url);
  var options = {
    host: 'your.webservice.com',
    path: params.path,
    headers: {'Authorization' : request.headers.authorization}
  };

  var req = http.get(options, function(res) {
    res.setEncoding('utf8');
    response.writeHead(res.statusCode, res.headers);
    res.on('data', function (chunk) {
      response.write(chunk);
    });
    res.on('end', function() {
      response.end();
    });
  });

  req.on('error', function(	e) {
    console.log('problem with request: ' + e.message);
  });
}

var server = http.createServer(function(request, response) {
  var params = url.parse(request.url);
  console.log("request params: " + util.inspect(params));

  var responseFile = findResponseFor(params.path);
  if (responseFile != null) {
    console.log("Response found: " + util.inspect(responseFile));
    writeFileToResponse(responseFile, response);
  } else {
    console.log("Response not found, calling NS API");
    writeWebserviceToResponse(request, response);
  }
});

var port = process.argv[2] || 1337;
server.listen(port)

util.puts("Server running at http://localhost:" + port);