var http = require("http");
var socks = require("socksv5");
var PROXY_PORT = 8000;
var HTTP_PORT = (process.env.PORT || 5000);

var server = socks.createServer(function(info, accept, deny) {
  accept();
});

server.useAuth(socks.auth.None());

server.listen(PROXY_PORT, "localhost", function() {
  console.log("Listening on port " + PROXY_PORT);
});

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello World!' + '\n' + JSON.stringify(req.headers, true, 2));
  res.end();
}).listen(HTTP_PORT);

