window.oauth = {};
window.oauth.REDIRECT_URI = "http://localhost:10101";
window.oauth.REDIRECT_ID = "org.uproxy.colony";
window.oauth.POLL_INTERVAL = 1000;
window.oauth.MAX_POLL_COUNT = 600; // Just give up after 10 minutes of waiting
window.oauth.SHUTDOWN_DELAY = 2000;
window.oauth._state = null;
window.oauth._isServerRunning = false;

window.oauth._genericHandler = function(method, params, callback) {
  cordova.exec(function(ret) {
    callback(null, ret);
  }, function(err) {
    callback(err);
  }, "OAuthRedirect", method, params);
};

window.oauth._startStopServer = function() {
  if (window.oauth._state !== null && !window.oauth._isServerRunning) {
    window.oauth._startListening(function() {});
    window.oauth._isServerRunning = true;
  } else if (window.oauth._state == null && window.oauth._isServerRunning) {
    window.oauth._stopListening(function() {});
    window.oauth._isServerRunning = false;
  }
};

window.oauth._startListening = window.oauth._genericHandler.bind({}, "startListening", []);
window.oauth._stopListening = window.oauth._genericHandler.bind({}, "stopListening", []);
window.oauth._getCode = window.oauth._genericHandler.bind({}, "getCode", []);

window.oauth._poll = function(reqObj) {
  window.oauth._getCode(function(reqObj, err, code) {
    if (err) {
      console.log(err);
      window.oauth._state.pollCount += 1;
      if (window.oauth._state.pollCount < window.oauth.MAX_POLL_COUNT) {
        setTimeout(window.oauth._poll.bind({}, reqObj), window.oauth.POLL_INTERVAL);
      } else {
        window.oauth._state.reject({
          "errcode": "UNKNOWN",
          "message": "Timed out waiting for code"
        });
        window.oauth._state = null;
      }
      return;
    }

    console.log(code);
    setTimeout(function() {
      window.oauth._startStopServer();
    }, window.oauth.SHUTDOWN_DELAY);
    window.oauth._state.resolve(code);
    window.oauth._state = null;
  }.bind({}, reqObj));
};

window.oauth.initiateOAuth = function (registeredRedirectURIs) {
  if (registeredRedirectURIs.indexOf(window.oauth.REDIRECT_URI) > -1) {
    return Promise.resolve({
      redirect: window.oauth.REDIRECT_URI,
      state: window.oauth.REDIRECT_ID + Math.random();
    });
  } else {
    return Promise.reject({
      "errcode": "UNKNOWN",
      "message": "No requested redirects can be handled"
    });
  }
};

window.oauth.launchAuthFlow = function(url, reqObj) {
  if (window.oauth._state !== null) {
    return Promise.reject({
      "errcode": "UNKNOWN",
      "message": "Already called launchAuthFlow with this state"
    });
  }
  window.oauth._state = {
    pollCount: 0
    resolve: null,
    reject: null
  };
  window.oauth._startStopServer();
  window.oauth._poll(reqObj);
  window.open(url);  
  return new Promise(function(resolve, reject) {
    window.oauth._state.resolve = resolve;
    window.oauth._state.reject = reject;
  });
};


/**
window.echo("echome", function(echoValue) {
  alert(echoValue == "echome"); // should alert true.
});
**/
