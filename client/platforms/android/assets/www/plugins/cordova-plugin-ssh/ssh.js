cordova.define("cordova-plugin-ssh.ssh", function(require, exports, module) { /* globals cordova, window */

window.ssh = {};

var sendCommand = function(method, params) {
  "use strict";
  return new window.Promise(function(fulfill, reject) {
    cordova.exec(fulfill, reject, 'Ssh', method, params);
  });
};

var Connection = function (id) {
  "use strict";
  this._id = id;
};

Connection.prototype.disconnect = function() {
  "use strict";
  return sendCommand('disconnect', [this._id]);
};

Connection.prototype.sendCommand = function(command) {
  "use strict";
  return sendCommand('sendCommand', [this._id, command]);
};

window.ssh.connectPassword = function(host, port, username, password) {
  "use strict";

  return sendCommand('connectPassword', [host, port, username, password]).then(function(connectionId) {
    return new Connection(connectionId);
  });
};

window.ssh.connectKey = function(host, port, username, privateKey) {
  "use strict";

  return sendCommand('connectKey', [host, port, username, privateKey]).then(function(connectionId) {
    return new Connection(connectionId);
  });
};

});
