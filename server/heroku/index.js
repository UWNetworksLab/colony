var socks = require("socksv5");
var PORT = 8000;

var server = socks.createServer(function(info, accept, deny) {
  accept();
});

server.useAuth(socks.auth.None());

server.listen(PORT, "localhost", function() {
  console.log("Listening on port " + PORT);
});

