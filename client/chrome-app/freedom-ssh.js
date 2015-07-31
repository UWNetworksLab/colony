var ssh2 = require('ssh2');
// var socks = require('socksv5');

var ssh = function (dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
};

ssh.prototype.createClient = function () {
  return Promise.resolve(new ssh2.Client());
};

ssh.prototype.getSsh = function () {
  return Promise.resolve(ssh2);
}

ssh.prototype.connect = function (serverIp, username, privateKey) {
  var conn = new ssh2.Client();
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

if (typeof freedom !== 'undefined') {
  freedom().providePromises(ssh);
}
