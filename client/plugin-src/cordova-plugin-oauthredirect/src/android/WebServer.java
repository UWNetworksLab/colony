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
    String html;
    if (session.getQueryParameterString().indexOf("token") > -1) {
      this.code = "http://localhost:" + this.port + session.getUri() +
                  "?" + session.getQueryParameterString();
      html = "<html><body>Blank</body></html>";
    } else {
      html = "<html><head>" +
              // "<meta http-equiv='refresh' content='0;url=" + redirectUrl + "'>" + 
              "</head><body>" + 
              "<br>" + 
              "<a id='redirectButton'>Return to Colony App</a>" +
              "</body><script>" +
              "var redirectUrl = '" + session.getUri() + "' + '?access_token=' + window.location.hash.match('access_token=(\\[^&]+)')[1];" + 
              "console.log(redirectUrl);" + 
              "var doRedirect = function() {" +
              "  var xhr = new XMLHttpRequest();" +
              "  xhr.onload = function() { window.open('app://org.uproxy.colony' + redirectUrl); };" +
              "  xhr.open('GET', redirectUrl);" +
              "  xhr.send();" +
              "};" +
              "doRedirect();" +
              "document.getElementById('redirectButton').addEventListener('click', doRedirect, false);" + 
              "</script></html>";

    }
    return this.newFixedLengthResponse(html);
  }
}
