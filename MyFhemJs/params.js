// set debugging (0,1,2)
// 1 - 
// 2 -
// 3 - 
// TODO: describe values
exports.debug = 1;

// port on which node.js service is reachable, if fhem.js is running as non-root, port must be greater than 1000
exports.nodePort = 8086;

// Hostname or IP of the FHEM server
exports.fhemHost = "up2one.fritz.box";

// telnet port of FHEM server
exports.fhemPort = 7072;

// use SSL for connections (true/false)
exports.useSSL = false;

// use connection password (true/false)
// it is recommended to use this only if useSSL is also true
// else the password is send as plain text
exports.useClientPassword = false;

// location of sha-256 hashed password
// only needed if useClientPassword = true
// create it on Linux shell with
// echo -n "mein Passwort" | sha256sum | cut -d' ' -f1 > /etc/fhem.js/pw_client_auth
exports.connectionPasswordFile = '/etc/fhem.js/pw_client_auth';

// location of SSL and client-auth certificats
// only used then useSSL set to true
exports.sslcert =
{
   key:    '/etc/ssl/private/bundle/ssl.key',
   cert:   '/etc/ssl/private/bundle/allcert.pem',
}
exports.cipher = 'HIGH:!aNULL:!MD5';

exports.message404 = '<html><head><title>404 Not Found</title></head><body bgcolor="white"><center><h1>404 Not Found</h1></center></body></html>';

