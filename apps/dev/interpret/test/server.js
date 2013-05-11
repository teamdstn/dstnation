var tls = require('tls'), fs = require('fs'), sys = require('sys');
var options = {
    key: fs.readFileSync('../.keys/teamdstn-key.pem'),
    cert: fs.readFileSync('../.keys/teamdstn-cert.pem')
};
sys.puts("TLS server started.");
tls.createServer(options, function (socket) {
    sys.puts("TLS connection established");
    socket.addListener("data", function (data) {
         sys.puts("Data received: " + data);
    });
   socket.pipe(socket);
}).listen(8000);