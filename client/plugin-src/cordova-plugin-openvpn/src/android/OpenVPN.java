package org.apache.cordova.openvpn;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import android.util.Log;
import android.app.Activity;
import android.content.Intent;
import android.content.Context;
import android.content.ComponentName;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.os.RemoteException;

import de.blinkt.openvpn.api.APIVpnProfile;
import de.blinkt.openvpn.api.IOpenVPNAPIService;


/**
* This class echoes a string called from JavaScript.
*/
public class OpenVPN extends CordovaPlugin {
  private static final int MSG_UPDATE_STATE = 0;
  private static final int MSG_UPDATE_MYIP = 1;
  private static final int START_PROFILE_EMBEDDED = 2;
  private static final int START_PROFILE_BYUUID = 3;
  private static final int ICS_OPENVPN_PERMISSION = 7;
  private static final int PROFILE_ADD_NEW = 8;
  protected IOpenVPNAPIService mService=null;
  private String mStartUUID=null;

  @Override
  protected void pluginInitialize() {
    //Intent intent = this.cordova.getActivity().getIntent();
    Intent icsopenvpnService = new Intent(IOpenVPNAPIService.class.getName());
    icsopenvpnService.setPackage("de.blinkt.openvpn");
    this.cordova.getActivity().bindService(icsopenvpnService, mConnection, Context.BIND_AUTO_CREATE);
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

  /**
   * Class for interacting with the main interface of the service.
   */
  private ServiceConnection mConnection = new ServiceConnection() {
    public void onServiceConnected(ComponentName className,
                                    IBinder service) {
      // This is called when the connection with the service has been
      // established, giving us the service object we can use to
      // interact with the service.  We are communicating with our
      // service through an IDL interface, so get a client-side
      // representation of that from the raw service object.
      
      mService = IOpenVPNAPIService.Stub.asInterface(service);
       
      try {
        // Request permission to use the API
        Intent i = mService.prepare(cordova.getActivity().getPackageName());
        if (i != null) {
          cordova.getActivity().startActivityForResult(i, ICS_OPENVPN_PERMISSION);
        } else {
          onActivityResult(ICS_OPENVPN_PERMISSION, Activity.RESULT_OK,null);
        }
      } catch (RemoteException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
      }
    }
     
    public void onServiceDisconnected(ComponentName className) {
      // This is called when the connection with the service has been
      // unexpectedly disconnected -- that is, its process crashed.
      mService = null;
    }
  };

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (resultCode == Activity.RESULT_OK) {
      if(requestCode==START_PROFILE_EMBEDDED) {
        //startEmbeddedProfile(false);
      }
      if(requestCode==START_PROFILE_BYUUID) {
        try {
          mService.startProfile(this.mStartUUID);
        } catch (RemoteException e) {
          e.printStackTrace();
        }
      }
      if (requestCode == ICS_OPENVPN_PERMISSION) {
        /**
        listVPNs();
        try {
          mService.registerStatusCallback(mCallback);
        } catch (RemoteException e) {
          e.printStackTrace();
        }
        **/

      }
      if (requestCode == PROFILE_ADD_NEW) {
        //startEmbeddedProfile(true);
      }
    }
  };

  private void echo(String message, CallbackContext callbackContext) {
    if (message != null && message.length() > 0) {
      callbackContext.success(message);
    } else {
      callbackContext.error("Expected one non-empty string argument.");
    }
  }

}

