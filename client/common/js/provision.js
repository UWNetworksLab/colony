/*globals require*/

/**
 * from a digital ocean networks descriptor object, return the
 * array of accessible IP addresses.
 */
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
var EVENT_POLL_TIMER = 10;
function waitForEvent(client, event, callback) {
  'use strict';
  client.eventGet(event, function (status) {
    if (status === "completed") {
      callback(true);
    } else if (status === "errored") {
      callback(false);
    } else {
      setTimeout(waitForEvent.bind({}, client, event, callback), EVENT_POLL_TIMER * 1000);
    }
  });
}

/**
 * Restart a droplet if it is not active.
 */
function startServer(client, id, callback) {
  'use strict';
  client.dropletPowerCycle(id, function (err, event) {
    if (err) {
      callback(err);
    } else {
      waitForEvent(event, callback);
    }
  });
}

/**
 * Given a clientID, apikey, target name, and ssh public key
 * make sure there is a droplet with requested name that exists and is powered on.
 * returns the endpoint host & port for connections.
 */
function provisionServer(clientID, apikey, name, sshkey) {
  'use strict';
  var Di = require('digitalocean-api'),
    Q = require('q'),
    client = new Di(clientID, apikey),
    deferred = Q.defer();
  client.dropletGetAll(function (err, droplets) {
    if (err) {
      return deferred.reject(err);
    }
    var i;
    for (i = 0; i < droplets.length; i += 1) {
      if (droplets[i].name === name) {
        if (droplets[i].status === "active") {
          deferred.resolve(extractAddresses(droplets[i].networks));
        } else {
          deferred.notify(0.5);
          return startServer(client, droplets[i].id);
        }
      }
    }

    var region = "nyc3", size = "512mb", image = "ubuntu-14-04-x64";
    client.dropletNew(name, size, image, region, {}, function (err, droplet) {
      deferred.notify(0.5);
      // TODO: need to wait for event to complete.
      deferred.resolve(extractAddresses(droplets.networks));
    });
  });
  return deferred.promise;
}
