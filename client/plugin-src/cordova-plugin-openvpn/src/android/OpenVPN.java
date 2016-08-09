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

import java.io.IOException;
import java.io.StringReader;

import de.blinkt.openvpn.VpnProfile;
import de.blinkt.openvpn.core.ConfigParser;
import de.blinkt.openvpn.core.OpenVPNService;
import de.blinkt.openvpn.core.ProfileManager;
import de.blinkt.openvpn.core.VPNLaunchHelper;

public class OpenVPN extends CordovaPlugin {
  final static String LOG_TAG = "OpenVPN";

  private static final String ACTION_START_VPN = "startVPN";
  private static final String ACTION_STOP_VPN = "stopVPN";
  private static final int REQUEST_CODE_PREPARE_VPN = 0;
  private static final int RESULT_OK = -1;  // Standard activity result success

  private OpenVPNService mOpenVpnService;

  @Override
  protected void pluginInitialize() {
    Log.d(LOG_TAG, "OpenVPNPlugin initializing.");
    // Bind and start service.
    Intent bindVpnService = new Intent(getBaseContext(), OpenVPNService.class);
    bindVpnService.setAction(OpenVPNService.START_SERVICE);
    getBaseContext().bindService(bindVpnService, mConnection, Context.BIND_AUTO_CREATE);
  }

  // Executes an action. Returns true if the supplied action exists.
  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    if (action.equals(ACTION_START_VPN)) {
      if (args.length() < 1) {
        callbackContext.error("Cannot start VPN without config.");
        return true;
      }
      String vpnConfig = args.getString(0);
      startVPN(vpnConfig, callbackContext);
      return true;
    } else if (action.equals(ACTION_STOP_VPN)) {
      stopVPN();
      return true;
    }
    return false;
  }

  private ServiceConnection mConnection = new ServiceConnection() {
    @Override
    public void onServiceConnected(ComponentName className,
                                   IBinder service) {
      OpenVPNService.LocalBinder binder = (OpenVPNService.LocalBinder)service;
      mOpenVpnService = binder.getService();
    }

    @Override
    public void onServiceDisconnected(ComponentName name) {
      Log.i(LOG_TAG, "VPN disconnected.");
      getBaseContext().unbindService(mConnection);
      mOpenVpnService = null;
    }
  };

  @Override
  public void onDestroy() {
    super.onDestroy();
    if (mOpenVpnService != null) {
      getBaseContext().unbindService(mConnection);
    }
  }

  private void startVPN(String vpnConfig, CallbackContext callbackContext) {
    if (vpnConfig == null || callbackContext == null) {
      final String msg = "Failed to start VPN service. Missing arguments.";
      Log.e(LOG_TAG, msg);
      callbackContext.error(msg);
      return;
    }

    ConfigParser cp = new ConfigParser();
    try {
      cp.parseConfig(new StringReader(vpnConfig));
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
      callbackContext.success("VPN running");
    } catch (ConfigParser.ConfigParseError e) {
      callbackContext.error(e.getMessage());
    } catch (IOException e) {
      callbackContext.error(e.getMessage());
    }
  }

  private void startVPNWithProfile(VpnProfile vp) {
    Intent vpnPermissionIntent = VpnService.prepare(getBaseContext());
    int needPassword = vp.needUserPWInput(false);
    if (vpnPermissionIntent != null || needPassword != 0) {
      // VPN has not been prepared, this intent will prompt the user for
      // permissions, and subsequently launch OpenVPN.
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
    if (mOpenVpnService != null && mOpenVpnService.getManagement() != null) {
      mOpenVpnService.getManagement().stopVPN(false);
    }
  }

  private Context getBaseContext() {
    return this.cordova.getActivity().getApplicationContext();
  }

}

