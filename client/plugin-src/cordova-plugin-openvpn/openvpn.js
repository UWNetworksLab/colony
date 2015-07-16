/* globals cordova, window */

window.vpn = {};
window.vpn._state = null;

window.vpn._genericHandler = function(method, params) {
  var args = Array.prototype.slice.call(arguments, 1);
  return new Promise(function(resolve, reject) {
    cordova.exec(resolve, reject, "OpenVPN", method, args);
  });
};

window.vpn.listProfiles = window.vpn._genericHandler.bind({}, "listProfiles");
window.vpn.startVPN = window.vpn._genericHandler.bind({}, "startVPN");

/**
window.echo("echome", function(echoValue) {
  alert(echoValue == "echome"); // should alert true.
});
**/
