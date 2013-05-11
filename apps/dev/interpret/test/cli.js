var net = require('net'), sys = require('sys');
var msg = "Hello from net client!";
client = net.createConnection(7000, function() {
    sys.puts("Sending data: " + msg);
    client.write(msg);
});
client.addListener("data", function (data) {
    sys.puts("Received: " + data);
});
/*
ldsp
tunnel.connect(ldap_port, ldap_host, ssloptions, function() {
    ldap.authenticate(tunnel.port, etc...)
}
*/