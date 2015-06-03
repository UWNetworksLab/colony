package org.apache.cordova.oauthredirect;

import java.util.Map.Entry;
import java.util.Properties;
import java.io.IOException;

import android.util.Log;

import fi.iki.elonen.NanoHTTPD;

public class WebServer extends NanoHTTPD {
  private String code;

  public WebServer(int port) throws IOException {
    super(port);
    this.code = null;
  }

  public String getCode() {
    return this.code;
  }

  @Override
  public Response serve(IHTTPSession session) {
    /**
    handler.post(new Runnable() {
      @Override
      public void run() {
        hello.setText(buf);
      }
    });
    **/

    //session.getQueryParameterString();
    StringBuilder buf = new StringBuilder();
    for (Entry<String, String> kv: session.getParms().entrySet()) {
      if (kv.getKey().equals("code")) { // Digital Ocean
        this.code = kv.getValue();
        buf.append(kv.getValue());
      }
    }

    String html = "<html><head><head><body>" + 
      buf.toString() + 
      "<br>" + 
      "<a href='intent:#Intent;action=;end'>Go back</a>"
      "</body><script>" +
      //"window.open()" +
      "</script></html>";
    return this.newFixedLengthResponse(html);
  }
}
