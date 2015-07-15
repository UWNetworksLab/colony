/* globals cordova, window */

window.vpn = {};
window.vpn._state = null;

window.vpn._genericHandler = function(method, params, callback) {
  "use strict";
  cordova.exec(function(ret) {
    callback(null, ret);
  }, function(err) {
    callback(err);
  }, "OAuthRedirect", method, params);
};


/**
window.echo("echome", function(echoValue) {
  alert(echoValue == "echome"); // should alert true.
});
**/
