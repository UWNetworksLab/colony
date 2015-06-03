

window.oauth = {};

window.oauth.genericHandler = function(method, params, callback) {
  cordova.exec(function(ret) {
    callback(null, ret);
  }, function(err) {
    callback(err);
  }, "OAuthRedirect", method, params);
};

window.oauth.startListening = window.oauth.genericHandler.bind({}, "startListening", []);
window.oauth.stopListening = window.oauth.genericHandler.bind({}, "stopListening", []);
window.oauth.getCode = window.oauth.genericHandler.bind({}, "getCode", []);

/**
window.echo("echome", function(echoValue) {
  alert(echoValue == "echome"); // should alert true.
});
**/
