var ssh;
var serverName = 'uProxyColonyChrome';
var colonyStarted = false;

var start = function (instance) {
  var elts = document.getElementsByClassName('cloudlogo');
  for (var i = 0; i < elts.length; i++) {
    elts[i].addEventListener('click', digitalOceanOauth);
  }

  ssh = instance();
  console.log('start() called. ssh ready.', ssh);
}

// Does the OAuth login flow for DigitalOcean
var digitalOceanOauth = function (e) {
  // Stop click handling after the button is pressed
  if (colonyStarted) { return; }
  else { colonyStarted = true; }

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

  digitalOceanServer.on('statusUpdate', function(update) {
    console.log('Got provision.js statusUpdate: ' + update);
    document.getElementById("status").innerText = update;
  });

  digitalOceanServer.start(accessToken, serverName).then(sshToServer);
}

var sshToServer = function (serverIps) {
  chrome.storage.local.get("DigitalOcean-" + serverName + "-PrivateKey", 
                           function (privateKey) {
    privateKey = privateKey["DigitalOcean-" + serverName + "-PrivateKey"];
    ssh.startSocksTunnel(serverIps[0], 'root', privateKey);
  });
}

window.onload = function (port) {
  if (typeof freedom !== 'undefined') {
    freedom('freedom-ssh.json').then(start);
  }
}.bind({}, self.port);

// TODO(kennysong): Close SSH connection on window close, which is not trivial
// in a Chrome app
