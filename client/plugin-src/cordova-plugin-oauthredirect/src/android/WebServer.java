package org.apache.cordova.oauthredirect;

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

  public void setCode(String c) {
    this.code = c;
  }

  @Override
  public Response serve(IHTTPSession session) {
    String html = "<html><head>" +
      // "<meta http-equiv='refresh' content='0;url=" + redirectUrl + "'>" + 
      "</head><body>" + 
      "<br>" + 
      "<a id='redirectButton'>Return to Colony App</a>" +
      "</body><script>" +
      "var redirectUrl = 'app://org.uproxy.colony" + session.getUri() + "' + '?access_token=' + window.location.hash.match('access_token=(\\[^&]+)')[1];" + 
      "console.log(redirectUrl);" + 
      "document.getElementById('redirectButton').setAttribute('href', redirectUrl);" + 
      "</script></html>";
    return this.newFixedLengthResponse(html);
  }
}
