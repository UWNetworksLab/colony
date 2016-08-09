/*globals window, document */

var app = {};
app.REDIRECT_URIS = [
  "http://localhost:10101"
];

app.initialize = function() {
  "use strict";
  // 'load', 'deviceready', 'offline', and 'online'.
  document.addEventListener('deviceready', app.onDeviceReady, false);
};

app.onDeviceReady = function() {
  "use strict";
  /**
  var parentElement = document.getElementById('deviceready');
  var listeningElement = parentElement.querySelector('.listening');
  var receivedElement = parentElement.querySelector('.received');
  listeningElement.setAttribute('style', 'display:none;');
  receivedElement.setAttribute('style', 'display:block;');
  console.log('Received Event: deviceready');
  **/

  window.oauth.getCode().then(function(code) {
    app.onOAuthToken(code);
  }).catch(function(err) {
    app.setupOAuthListener();
  });

};

app.setupOAuthListener = function() {
  "use strict";
  var elts = document.getElementsByClassName("cloudlogo");
  var onclickHandler = function(e) {
    window.oauth.initiateOAuth(app.REDIRECT_URIS).then(function(obj) {
      var url = "https://cloud.digitalocean.com/v1/oauth/authorize?" +
        "client_id=24cb4fd7317204781602be3b19cce72d9258bc59ba08a50b815f65adfc6ca534&" +
        "response_type=token&" +
        "redirect_uri=" + encodeURIComponent(obj.redirect) + "&" +
        "state=" + encodeURIComponent(obj.state) + "&" +
        "scope=read%20write";
      return window.oauth.launchAuthFlow(url, obj);
    }).then(function(redirectUrl) {
      console.log("Ignoring code: " + redirectUrl);
      // app.onOAuthToken(redirectUrl);
      // There's a new activity launched with the auth code.
      console.log("Exiting");
      window.navigator.app.exitApp();
    }).catch(function(err) {
      console.log("launchAuthFlow error: " + err);
      // @todo handle error
    });
  };
  for (var i = 0; i < elts.length; i++) {
    elts[i].addEventListener("click", onclickHandler);
  }
};

app.onOAuthToken = function(responseUrl) {
  "use strict";
  // Hide all old UI elements
  //document.getElementById('deviceready').style.display = 'none';
  document.getElementById('starttext').style.display = 'none';

  console.log("Got token: " + responseUrl);
  var query = responseUrl.substr(responseUrl.indexOf('?') + 1),
    param,
    params = {},
    keys = query.split('&'),
    i = 0;

  for (i = 0; i < keys.length; i += 1) {
    param = keys[i].substr(0, keys[i].indexOf('='));
    params[param] = keys[i].substr(keys[i].indexOf('=') + 1);
  }

  var DigitalOceanServer = require('provision');
  var digitalOceanServer = new DigitalOceanServer();
  var serverName = 'uProxyColony';

  digitalOceanServer.on('statusUpdate', function(update) {
    console.log('got statusUpdate: ' + update);
    document.getElementById("status").innerText = update;
  });

  document.getElementById("status").innerText = 'Got access token: ' + params.access_token;
  digitalOceanServer.start(params.access_token, serverName).then(function (serverIps) {
    console.log("serverIP is: " + serverIps[0]);
    var privateKey = window.localStorage.getItem("DigitalOcean-" + serverName + "-PrivateKey");
    console.log('privateKey is: ' + privateKey);

    var connection;
    function connectToSsh() {
      console.log("Connecting to SSH...");
      window.ssh.connectKey(serverIps[0], 22, 'root', privateKey).then(function (newConnection) {
        connection = newConnection;
        console.log('connection:', connection);
        document.getElementById("status").innerText = 'Connected to SSH';
        console.log('Running setup-openvpn.sh');
        document.getElementById("status").innerText = 'Running setup-openvpn.sh';
        return connection.sendCommand('curl https://raw.githubusercontent.com/uProxy/colony/master/server/setup-openvpn.sh | bash');
      }).then(function (result) {
        console.log('result:', result);
        document.getElementById("status").innerText = 'Successfully ran setup-openvpn.sh';
        console.log('Copying client.ovpn');
        document.getElementById("status").innerText = 'Copying client.ovpn';
        return connection.sendCommand('cat /etc/openvpn/client.ovpn');
      }).then(function (ovpnFile) {
        console.log('ovpnFile: ', ovpnFile);
        document.getElementById("status").innerText = 'Successfully copied client.ovpn';
        console.log('Starting VPN');
        document.getElementById("status").innerText = 'Starting VPN';
        return window.vpn.startVPN(ovpnFile.text);
      }).then(function (vpnResult) {
        document.getElementById("status").innerText = vpnResult;
        console.log('vpnResult: ', vpnResult);
      }).catch(function (err) {
        console.log(err);
        // Reconnect if SSH failed (sometimes fails right after new droplet creation)
        if (err.indexOf('ECONNREFUSED') !== -1) {
          setTimeout(connectToSsh, 10*1000);
        // vpn.startVPN() will always reject with this error
        // TODO: Figure out what's going on here
        } else if (err.indexOf('Invalid action') !== -1) {
          console.log('Check VPN in notification bar');
          document.getElementById("status").innerText = 'Check VPN in notification bar';
        }
      });
    }
    connectToSsh();

  });
};

app.initialize();
