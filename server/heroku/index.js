var http = require("http");
var httpProxy = require("http-proxy");
var PROXY_PORT = (process.env.PORT || 8000);

var proxy = httpProxy.createProxyServer({});
 
// Create your target server 
var server = http.createServer(function (req, res) {
  //@todo Get the desired target out from a hidden header (e.g. X-COLONY-HOST)
  req.headers.host = "wikipedia.org";
  proxy.web(req, res, { target: "http://www.wikipedia.org" });
}).listen(PROXY_PORT);
