/*globals require*/
var Q = require('q');

/**
 * from a digital ocean networks descriptor object, return the
 * array of accessible IP addresses.
 */
// TODO: Make async and query DO until we get an ip address
function extractAddresses(networks) {
  'use strict';
  var addrs = [];
  Object.keys(networks).forEach(function (type) {
    networks[type].forEach(function (address) {
      if (address.type === "public" && address.ip_address) {
        addrs.push(address.ip_address);
      }
    });
  });
  return addrs;
}

/**
 * wait for a DI event to complete
 */
var EVENT_POLL_TIMER = 1;  // TODO: pick right value
function waitForAction(client, dropletId, actionId) {
  'use strict';
  var deferred = Q.defer();
  function _getAction() {
    client.dropletsGetAction(dropletId, actionId, function (err, res, body) {
      var status = body.action.status;
      if (status === "completed") {
        return deferred.resolve();
      } else if (status === "errored") {
        return deferred.reject();
      } else {
        setTimeout(_getAction, EVENT_POLL_TIMER * 1000);
      }
    });
  }
  _getAction();
  return deferred.promise;
}

/**
 * Restart a droplet if it is not active.
 */
function startServer(client, dropletId) {
  'use strict';
  var deferred = Q.defer();
  client.dropletsRequestAction(dropletId, {"type": "power_on"}, function (err, res, body) {
    if (err) {
      deferred.reject(err);
    } else {
      debugger;
      waitForAction(client, dropletId, body.action.id).then(function() {
        return deferred.resolve();
      });
    }
  });
  return deferred.promise;
}

/**
 * Given a clientID, accessToken, target name, and ssh public key
 * make sure there is a droplet with requested name that exists and is powered on.
 * returns the endpoint host & port for connections.
 */
module.exports = function provisionServer(accessToken, name, sshkey) {
  'use strict';
  var DigitalOcean = require('do-wrapper'),
    client = new DigitalOcean(accessToken, 25),
    deferred = Q.defer();

  client.dropletsGetAll({}, function (err, res, body) {
    // Check if there is an existing droplet with name, and start it
    var droplets = body.droplets;
    if (err) {
      return deferred.reject(err);
    }
    var i;
    for (i = 0; i < droplets.length; i += 1) {
      if (droplets[i].name === name) {
        if (droplets[i].status === "active") {
          return deferred.resolve(extractAddresses(droplets[i].networks));
        } else {
          return startServer(client, droplets[i].id).then(function() {
            deferred.resolve(extractAddresses(droplets[i].networks));
          });
        }
      }
    }

    // Otherwise start a new droplet
    var config = {
      name: name,
      region: "nyc3",
      size: "512mb",
      image: "ubuntu-14-04-x64"
      // ssh_keys: [sshkey]
    };
    client.dropletsCreate(config, function (err, res, body) {
      debugger;
      var droplet = body.droplet;
      waitForAction(client, droplet.id, body.links.actions[0].id).then(function() {
        deferred.resolve(extractAddresses(droplet.networks));
      });
    });
  });

  return deferred.promise;
}
