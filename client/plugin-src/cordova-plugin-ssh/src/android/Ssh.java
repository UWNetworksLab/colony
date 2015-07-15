package org.apache.cordova.ssh;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Properties;
import java.util.ArrayList;

import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.ChannelExec;

import android.util.Log;

/**
* This class echoes a string called from JavaScript.
*/
public class Ssh extends CordovaPlugin {
  JSch jsch;
  ArrayList<Session> sessions;

  @Override
  protected void pluginInitialize() {
    jsch = new JSch();
    sessions = new ArrayList<Session>();
  }

  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    try {
      if (action.equals("connect")) {

        String host = args.getString(0);
        int port = args.getInt(1);
        String username = args.getString(2);
        String password = args.getString(3);

        this.connect(host, port, username, password, callbackContext);
        return true;
      } else if (action.equals("sendCommand")) {
        int connectionId = args.getInt(0);
        String command = args.getString(1);

        this.sendCommand(connectionId, command, callbackContext);
        return true;
      } else if (action.equals("disconnect")) {
        int connectionId = args.getInt(0);
        this.disconnect(connectionId, callbackContext);
        return true;
      }
    } catch (Exception e) {
      callbackContext.error(e.toString());
    }
    return false;
  }

  private Session getSession(int idConnection) throws IndexOutOfBoundsException {
    return sessions.get(idConnection);
  }

  private void connect(String host, int port, String username, String password, CallbackContext callbackContext) throws JSONException, JSchException {
    int idConnection = sessions.size();
    Session session = jsch.getSession(username, host, port);
    sessions.add(session);

    session.setPassword(password);

    // Avoid asking for key confirmation
    Properties prop = new Properties();
    prop.put("StrictHostKeyChecking", "no"); //TODO this is bad
    session.setConfig(prop);

    session.connect();

    callbackContext.success(idConnection);
  }

  private void sendCommand(int idConnection, String command, CallbackContext callbackContext) throws JSchException, IOException, JSONException {
    Session session = this.getSession(idConnection);
    ChannelExec channel = (ChannelExec)session.openChannel("exec");
    channel.setCommand(command);

    ByteArrayOutputStream output = new ByteArrayOutputStream();
    InputStream in = channel.getInputStream();

    channel.connect();

    byte[] data = new byte[1024];
    int len = 0;
    while (!channel.isClosed() || in.available() > 0) {
      if (in.available() > 0) {
        if (len + in.available() > data.length) {
          byte[] tmp = new byte[data.length * 2 + in.available()];
          System.arraycopy(data, 0, tmp, 0, len);
          data = tmp;
        }
        int read = in.read(data, len, data.length - len);
        len += read;
      } else {
        try {
          Thread.sleep(25);
        } catch (Exception e) {
          callbackContext.error(e.toString());
          channel.disconnect();
          return;
        }
      }
    }

    channel.disconnect();

    JSONObject ret = new JSONObject();

    ret.put("text", new String(data, 0, len));
    ret.put("status", channel.getExitStatus());

    callbackContext.success(ret);
  }

  private void disconnect(int idConnection, CallbackContext callbackContext) throws JSchException {
    Session session = this.getSession(idConnection);
    session.disconnect();

    callbackContext.success();
  }
}
