var fs = require('fs'),
    path = require('path');

[
  require('./lib/server'),
  require('./lib/client'),
  require('./lib/Agents')
].forEach(function(exp) {
  var keys = Object.keys(exp);
  for (var i = 0, len = keys.length; i < len; ++i)
    exports[keys[i]] = exp[keys[i]];
});

exports.auth = {
  None: require('./lib/auth/None'),
  UserPassword: require('./lib/auth/UserPassword')
};
