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
  var parentElement = document.getElementById('deviceready');
  var listeningElement = parentElement.querySelector('.listening');
  var receivedElement = parentElement.querySelector('.received');
  listeningElement.setAttribute('style', 'display:none;');
  receivedElement.setAttribute('style', 'display:block;');
  console.log('Received Event: deviceready');

  app.setupOAuthListener();
};

app.setupOAuthListener = function() {
  "use strict";
  var elts = document.getElementsByClassName("cloudlogo");
  var onclickHandler = function(e) {
    window.oauth.initiateOAuth(app.REDIRECT_URIS).then(function(obj) {
      var url = "https://cloud.digitalocean.com/v1/oauth/authorize?" +
        "client_id=24cb4fd7317204781602be3b19cce72d9258bc59ba08a50b815f65adfc6ca534&" +
        "response_type=code&" +
        "redirect_uri=" + encodeURIComponent(obj.redirect) + "&" +
        "state=" + encodeURIComponent(obj.state);
      return window.oauth.launchAuthFlow(url, obj);
    }).then(function (responseUrl) {
      console.log(responseUrl);
      document.getElementById("title").appendChild(document.createTextNode(responseUrl));
    });
  };
  for (var i = 0; i < elts.length; i++) {
    elts[i].addEventListener("click", onclickHandler);
  }
};


app.initialize();
