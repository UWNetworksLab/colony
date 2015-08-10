var ssh2 = require('ssh2');
var socks = require('socksv5');

var ssh = function (dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
};

// The active SSH session
ssh.prototype.activeClient = undefined;

// Connects to a remote server via SSH and runs the "uptime" command
ssh.prototype.connect = function (serverIp, username, privateKey) {
  console.log("Creating SSH connection...");
  var conn = new ssh2.Client();
  conn.on('ready', function() {
    console.log('SSH tunnel is ready');
    conn.exec('uptime', function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        conn.end();
        Promise.resolve('DONE');
      }).on('data', function(data) {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', function(data) {
        console.log('STDERR: ' + data);
      });
    });
  }).connect({
    host: serverIp,
    port: 22,
    username: username,
    privateKey: privateKey 
  });
}

// Start a SOCKS5 server and an SSH tunnel that forwards requests from
// the server
ssh.prototype.startSocksTunnel = function (serverIp, username, privateKey) {
  var self = this;
  socks.createServer(function (info, accept, deny) {
    onConnection(info, accept, deny);
  }).listen(1080, '0.0.0.0', 10, function() {
    console.log('SOCKS5 proxy server started on port 1080');
  }).useAuth(socks.auth.None());

  // Handler function when our SOCKS5 server receives a connection
  var onConnection = function (info, accept, deny) {
    // if (self.activeClient !== undefined) {
    //   // Use existing SSH connection
    //   console.log("Received request; reusing existing SSH connection...");
    //   forwardThroughSsh(info, accept, deny);
    // } else {

      // Start new SSH connection and use that
      console.log("Received request; establishing SSH connection...");
      var conn = new ssh2.Client();
      self.activeClient = conn;
      conn.on('ready', function() {
        console.log("SSH connection established")
        forwardThroughSsh(info, accept, deny);
      }).on('error', function(err) {
        deny();
      }).connect({
        host: serverIp,
        port: 22,
        username: 'root',
        privateKey: privateKey
      });
      
    // }
  }

  // Forwards a request through the currently active SSH tunnel
  var forwardThroughSsh = function (info, accept, deny) {
    var conn = self.activeClient;
    conn.forwardOut(info.srcAddr, info.srcPort, info.dstAddr, info.dstPort,
                    function(err, stream) {
      if (err) {
        conn.end();
        return deny();
      }

      var clientSocket;
      if (clientSocket = accept(true)) {
        stream.pipe(clientSocket).pipe(stream).on('close', function() {
          conn.end();
        });
      } else {
        conn.end();
      }
    });
  };
}

// Closes the currently active SSH client
ssh.prototype.closeSsh = function () {
  this.activeClient.end();
}

if (typeof freedom !== 'undefined') {
  freedom().providePromises(ssh);
}
