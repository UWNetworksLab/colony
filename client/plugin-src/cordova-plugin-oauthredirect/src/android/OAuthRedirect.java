package org.apache.cordova.oauthredirect;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import android.util.Log;

/**
* This class echoes a string called from JavaScript.
*/
public class OAuthRedirect extends CordovaPlugin {
  private static final int PORT = 10101;
  private WebServer server;

  @Override
  protected void pluginInitialize() {
    try {
      server = new WebServer(PORT);
      server.start();
    } catch(IOException e) {
      Log.i("!!!", "!!!");
    }
  }

  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    if (action.equals("echo")) {
      String message = args.getString(0);
      this.echo(message, callbackContext);
      return true;
    }
    return false;
  }

  private void echo(String message, CallbackContext callbackContext) {
    if (message != null && message.length() > 0) {
      callbackContext.success(message);
    } else {
      callbackContext.error("Expected one non-empty string argument.");
    }
  }
}

