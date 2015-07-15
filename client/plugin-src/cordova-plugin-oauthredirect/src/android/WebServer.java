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
              // "<meta http-equiv='refresh' content='0;url=" + path + "'>" + 
              "</head><body>" + 
              "<br>" + 
              "<a id='redirectButton'>Return to Colony App</a>" +
              "</body><script>" +
              "var path = '" + session.getUri() + "' + '?access_token=' + window.location.hash.match('access_token=(\\[^&]+)')[1];" + 
              "console.log(path);" + 
              "var doRedirect = function() {" +
              "  var xhr = new XMLHttpRequest();" +
              "  xhr.onload = function() { window.location.href = 'app://org.uproxy.colony' + path; };" +
              "  xhr.open('GET', path);" +
              "  xhr.send();" +
              "};" +
              "doRedirect();" +
              "document.getElementById('redirectButton').setAttribute('href', 'app://org.uproxy.colony' + path);" + 
              "</script></html>";

    if (!(session.getQueryParameterString() == null) &&
        session.getQueryParameterString().indexOf("access_token") > -1) {
      this.code = "http://localhost:" + this.port + session.getUri() +
                  "?" + session.getQueryParameterString();
    }
    return this.newFixedLengthResponse(html);
  }
}
