var app = {}

app.initialize = function() {
  // 'load', 'deviceready', 'offline', and 'online'.
  document.addEventListener('deviceready', app.onDeviceReady, false);
};

app.onDeviceReady = function() {
  var parentElement = document.getElementById('deviceready');
  var listeningElement = parentElement.querySelector('.listening');
  var receivedElement = parentElement.querySelector('.received');
  listeningElement.setAttribute('style', 'display:none;');
  receivedElement.setAttribute('style', 'display:block;');
  console.log('Received Event: deviceready');

  app.setupOAuthListener();
};

app.setupOAuthListener = function() {
  var elts = document.getElementsByClassName("cloudlogo");
  for (var i = 0; i < elts.length; i++) {
    elts[i].addEventListener("click", function(e) {
      window.oauth.startListening(function() {});
      app.codeProbe();
    });

  }
};

      document.getElementById("title").appendChild(document.createTextNode(code))

app.initialize();
