package org.apache.cordova.oauthredirect;

import java.util.Map.Entry;
import java.util.Properties;
import java.io.IOException;

import android.util.Log;

import fi.iki.elonen.NanoHTTPD;

public class WebServer extends NanoHTTPD {
  private String code;
  private int port;

  public WebServer(int port) throws IOException {
    super(port);
    this.port = port;
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
    //for (Entry<String, String> kv: session.getParms().entrySet()) {
    /**
    for (Entry<String, String> kv: session.getHeaders().entrySet()) {
      if (kv.getKey().equals("code")) { // Digital Ocean
        this.code = kv.getValue();
      }
    }
    **/
    this.code = "http://localhost:" + this.port +
      session.getUri() + 
      "?" + session.getQueryParameterString();

    String html = "<html><head><head><body>" + 
      this.getCode() + 
      "<br>" + 
      "<a href='INTENT_TO_APP'>Go Back</a>" +
      "</body><script>" +
      //"window.open()" + // Or try to open automatically
      "</script></html>";
    return this.newFixedLengthResponse(html);
  }
}
