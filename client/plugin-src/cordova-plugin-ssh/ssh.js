/* globals cordova, window */

window.ssh = {};
window.ssh._state = null;

var sendCommand = function(method, params) {
  return new window.Promise(function(fulfill, reject) {
    cordova.exec(function(ret) {
      fulfill(ret);
    }, function(err) {
      if (!err instanceof Error) {
        err = new Error(err);
      }

      reject(err);
    }, 'Ssh', method, params);
  });
}

var Connection = function (id) {
  "use strict";
  this._id = id;
};

Connection.prototype.disconnect = function() {
  "use strict";
  return sendCommand('disconnect', [this._id]);
}

Connection.prototype.sendCommand = function(command) {
  "use strict";
  return sendCommand('sendCommand', [this._id, command]);
}

window.ssh.connect = function(host, port, username, password) {
  "use strict";

  return sendCommand('connect', [host, port, username, password]).then(function(connectionId) {
    return new Connection(connectionId);
  });
};
