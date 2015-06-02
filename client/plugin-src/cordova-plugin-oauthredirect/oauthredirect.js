
window.echo = function(str, callback) {
  cordova.exec(callback, function(err) {
    callback('Nothing to echo.');
  }, "OAuthRedirect", "echo", [str]);
};

//window.echo("echome", function(echoValue) {
//  alert(echoValue == "echome"); // should alert true.
//});
