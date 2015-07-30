var ssh = require('ssh2');

// Does the OAuth login flow for DigitalOcean
var digitalOceanOauth = function(e) {
  // Client ID and redirectUrl is set in kennysong's DO account
  var clientId = '3d5defc9d57ee3e752a97a3fe9fefbc9ded1d230443c02b7e5b99641d11f023d';
  var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL());
  var oauthUrl = 'https://cloud.digitalocean.com/v1/oauth/authorize?' +
    'client_id=' + clientId + '&' +
    'response_type=token&' +
    'redirect_uri=' + redirectUrl + '&' +
    'scope=read%20write';

  chrome.identity.launchWebAuthFlow({'url': oauthUrl, 'interactive': true}, 
                                    function(redirect_url) { 
    var hash = (new URL(redirect_url)).hash;
    var startIndex = hash.indexOf('access_token=') + 13;
    var endIndex = hash.indexOf('&', startIndex);
    var accessToken = hash.substring(startIndex, endIndex);
    provisionDigitalOcean(accessToken);
  });
};

// Provisions a server on DigitalOcean
var provisionDigitalOcean = function (accessToken) {
  // Hide old UI elements
  document.getElementById('starttext').style.display = 'none';

  // Create the server
  var DigitalOceanServer = require('../www/js/provision');
  var digitalOceanServer = new DigitalOceanServer();
  var serverName = 'uProxyColony';

  digitalOceanServer.on('statusUpdate', function(update) {
    console.log('got statusUpdate: ' + update);
    document.getElementById("status").innerText = update;
  });

  digitalOceanServer.start(accessToken, serverName).then(function (serverIps) {
    console.log("serverIP is: " + serverIps[0]);
    chrome.storage.local.get("DigitalOcean-" + serverName + "-PrivateKey", 
                             function (privateKey) {
      privateKey = privateKey["DigitalOcean-" + serverName + "-PrivateKey"];
      console.log('privateKey is: ', privateKey);
      sshToServer(serverIps[0], 'root', privateKey);
    });
  });
}

var sshToServer = function (serverIp, username, privateKey) {
  var conn = new ssh.Client();
  conn.on('ready', function() {
    console.log('Client :: ready');
    conn.exec('uptime', function(err, stream) {
      if (err) throw err;
      stream.on('close', function(code, signal) {
        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
        conn.end();
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

var elts = document.getElementsByClassName('cloudlogo');
for (var i = 0; i < elts.length; i++) {
  elts[i].addEventListener('click', digitalOceanOauth);
}
