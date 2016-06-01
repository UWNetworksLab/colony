package org.apache.cordova.openvpn;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
import android.app.Activity;
import android.content.Intent;
import android.content.Context;
import android.content.ComponentName;
import android.content.ServiceConnection;
import android.net.VpnService;
import android.os.IBinder;
import android.os.RemoteException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;

import de.blinkt.openvpn.VpnProfile;
import de.blinkt.openvpn.api.GrantPermissionsActivity;
import de.blinkt.openvpn.core.ConfigParser;
import de.blinkt.openvpn.core.OpenVPNService;
import de.blinkt.openvpn.core.ProfileManager;
import de.blinkt.openvpn.core.VPNLaunchHelper;

public class OpenVPN extends CordovaPlugin {
  final static String LOG_TAG = "OpenVPNPlugin";

  private static final int PREPARE_VPN = 0;

  private OpenVPNService mService;

  @Override
  protected void pluginInitialize() {
    Log.d(LOG_TAG, "OpenVPNPlugin initializing.");
    // Start service.
    Intent serviceIntent = new Intent(getBaseContext(), OpenVPNService.class);
    this.cordova.getActivity().startService(serviceIntent);
    // Bind service.
    Intent intent = new Intent(getBaseContext(), OpenVPNService.class);
    intent.setAction(OpenVPNService.START_SERVICE);
    this.cordova.getActivity().bindService(intent, mConnection, Context.BIND_AUTO_CREATE);

    prepareVPNService();
  }

  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    if (action.equals("startVPN")) {
      String inlineConfig = args.getString(0);
      this.startVPN(inlineConfig, callbackContext);
      return true;
    } else if (action.equals("stopVPN")) {
      this.stopVPN();
      return true;
    }
    return false;
  }

  private ServiceConnection mConnection = new ServiceConnection() {
    @Override
    public void onServiceConnected(ComponentName className,
                                   IBinder service) {
      OpenVPNService.LocalBinder binder = (OpenVPNService.LocalBinder)service;
      mService = binder.getService();
    }

    @Override
    public void onServiceDisconnected(ComponentName arg0) {
        Log.i(LOG_TAG, "VPN disconnected.");
        mService = null;
    }
  };

  private void prepareVPNService() {
    if (VpnService.prepare(getBaseContext()) == null) {
      Log.d(LOG_TAG, "Prepared OpenVPN service.");
    } else {
      Intent requestPermission = new Intent(getBaseContext(), GrantPermissionsActivity.class);
      this.cordova.getActivity().startActivityForResult(requestPermission, PREPARE_VPN);
    }
  }

  private void startVPN(String inlineConfig, CallbackContext callbackContext) {
    ConfigParser cp = new ConfigParser();
    try {
      cp.parseConfig(new StringReader(inlineConfig));
      VpnProfile vp = cp.convertProfile();
      vp.mName = "OpenVPN";
      vp.mProfileCreator = getBaseContext().getPackageName();
      if (vp.checkProfile(getBaseContext()) !=
            de.blinkt.openvpn.R.string.no_error_found) {
          callbackContext.error(
              getBaseContext().getString(vp.checkProfile(getBaseContext())));
      }

      ProfileManager.setTemporaryProfile(vp);
      startVPNWithProfile(vp);
    } catch (ConfigParser.ConfigParseError e) {
      callbackContext.error(e.getMessage());
    } catch (IOException e) {
      callbackContext.error(e.getMessage());
    }
  }

  private void startVPNWithProfile(VpnProfile vp) {
    Intent vpnPermissionIntent = VpnService.prepare(getBaseContext());
    int needPassword = vp.needUserPWInput(false);

    if(vpnPermissionIntent != null || needPassword != 0){
      Intent shortVPNIntent = new Intent(Intent.ACTION_MAIN);
      shortVPNIntent.setClass(getBaseContext(), de.blinkt.openvpn.LaunchVPN.class);
      shortVPNIntent.putExtra(de.blinkt.openvpn.LaunchVPN.EXTRA_KEY, vp.getUUIDString());
      shortVPNIntent.putExtra(de.blinkt.openvpn.LaunchVPN.EXTRA_HIDELOG, true);
      shortVPNIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      this.cordova.getActivity().startActivity(shortVPNIntent);
    } else {
      Log.d(LOG_TAG, "Starting OpenVPN.");
      VPNLaunchHelper.startOpenVpn(vp, getBaseContext());
    }
  }

  private void stopVPN() {
    if (mService != null && mService.getManagement() != null) {
        mService.getManagement().stopVPN(false);
    }
  }

  private Context getBaseContext() {
    return this.cordova.getActivity().getApplicationContext();
  }

}

