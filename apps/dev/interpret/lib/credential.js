var path      = require('path')
  , fs        = require('fs')
  , crypto    = require('crypto')
  , spawn     = require('child_process').spawn
  , pssl      = false
  ;

var generateCerts = function(host, options, cb){
  if(!pssl)
    return certpem(options, cb);
  if(!host)
    return cb('ERR : __host');

  options = options || {};
  options.host = host;
  options.pth = options.pth || path.join(__dirname, "../.certs");
  options.ca = options.ca   || "ca";

  var _hst = path.join(options.pth, host)
    , _ca  = path.join(options.pth, options.ca)
    //, _cnf = path.normalize(options.cnf || "D:\.Lib\OpenSSL-Win64\bin\openssl.cnf");
    ;


  if(fs.existsSync(_hst+'.crt'))
    return credention(options, cb);

  options.O   = options.O || "TeamDstn";
  options.CN  = options.CN || "teamdstn.info";

  var n= fs.existsSync(_ca+'.key') && fs.existsSync(_ca+'.crt') ? 2 : 0
    , certs  =  [
      ['genrsa', '-out', _ca+'.key', '1024'],
      //['req', '-config', _cnf, '-new', '-x509', '-days', '365', '-key', _ca+'.key', '-out', _ca+'.crt', '-subj', '/C=US/ST=CA/L=SF/O='+options.O+'/OU=STFU/CN='+options.CN+' CA'],
      ['req', '-new', '-x509', '-days', '365', '-key', _ca+'.key', '-out', _ca+'.crt', '-subj', '/C=US/ST=CA/L=SF/O='+options.O+'/OU=STFU/CN='+options.CN+' CA'],
      ['genrsa', '-out', _hst+'.key', '1024'],
      //['req', '-config', _cnf, '-new', '-key', _hst+'.key', '-out', _hst+'.csr', '-subj', '/C=US/ST=CA/L=SF/O='+options.O+'/OU=STFU/CN='+options.host ],
      ['req', '-new', '-key', _hst+'.key', '-out', _hst+'.csr', '-subj', '/C=US/ST=CA/L=SF/O='+options.O+'/OU=STFU/CN='+options.host ],
      ['x509', '-req', '-days', '365', '-in',  _hst+'.csr', '-CA',  _ca+'.crt', '-CAkey', _ca+'.key', '-set_serial', Date.now(), '-out', _hst+'.crt']
    ]
    , len = certs.length;

  return (function ____(){
    var psn = spawn('openssl', certs[n]);
    //psn.stdout.on('data', function (data) { console.log('stdout: ' + data); });
    //psn.stderr.on('data', function (data) { console.log('stderr: ' + data); });
    psn.on('exit', function (code, err) {
      if (code === 0) {
        return n++ < len-1 ? ____() : credention(options, cb);
      }else{
        return cb("ERR : "+code, options);
      }
    });
  })();
}

var certpem = function(options, next) {
  var _pth = path.join(__dirname, "../.keys")
  var _tls = {
    key:  fs.readFileSync(_pth + path.sep + "teamdstn-key.pem"  ),
    cert: fs.readFileSync(_pth + path.sep + "teamdstn-cert.pem" ),
    ca:   fs.readFileSync(_pth + path.sep + "teamdstn-csr.pem"  )
  },
  _credential = crypto.createCredentials(_tls);
  _credential.context.setCiphers('RC4-SHA:AES128-SHA:AES256-SHA');
  return next ? next(null, _credential) : _credential;
};

var credention = function(options, next) {
  var _tls = {
    key:  fs.readFileSync(path.join(options.pth, options.host+".key")),
    cert: fs.readFileSync(path.join(options.pth, options.host+".crt")),
    ca:   fs.readFileSync(path.join(options.pth, options.ca+".crt"))
  },
  _credential = crypto.createCredentials(_tls);
  _credential.context.setCiphers('RC4-SHA:AES128-SHA:AES256-SHA');

  return next ? next(null, _credential) : _credential;
};

exports.build = function(host, options, cb) {
  generateCerts(host, options, cb);
};


