package org.apache.cordova.openvpn;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import android.util.Log;
import android.content.Intent;

/**
* This class echoes a string called from JavaScript.
*/
public class OpenVPN extends CordovaPlugin {

  @Override
  protected void pluginInitialize() {
    Intent intent = this.cordova.getActivity().getIntent();
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

