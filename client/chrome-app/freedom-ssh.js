var ssh2 = require('ssh2');
var socks = require('socksv5');

var ssh = function (dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
};

// Does not work – maybe a manifest issue?
ssh.prototype.createClient = function () {
  return Promise.resolve(new ssh2.Client());
};

ssh.prototype.connect = function (serverIp, username, privateKey) {
  var conn = new ssh2.Client();
  console.log('Conn:', conn);
  conn.on('ready', function() {
    console.log('Client :: ready');
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

ssh.prototype.startSocksTunnel = function (serverIp, username, privateKey) {
  socks.createServer(function(info, accept, deny) {
    console.log('socksv5.Server connection listener called, info:', info);
    var conn = new ssh2.Client();
    console.log('SSH Conn:', conn);
    conn.on('ready', function() {
      console.log('Client :: ready');
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
    }).on('error', function(err) {
      deny();
    }).connect({
      host: serverIp,
      port: 22,
      username: username,
      privateKey: privateKey 
    });
  }).listen(1080, '0.0.0.0', 10, function() {
    console.log('SOCKSv5 proxy server started on port 1080');
  }).useAuth(socks.auth.None());
}

if (typeof freedom !== 'undefined') {
  freedom().providePromises(ssh);
}
