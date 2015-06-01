package org.apache.cordova.oauthredirect;

import java.util.Map.Entry;
import java.util.Properties;
import java.io.IOException;

asfadsf

public class WebServer extends NanoHTTPD {
  private static final int PORT = 10101;

  public WebServer() throws IOException {
    super(PORT, null);
  }

  @Override
  public Response serve(String uri, String method, Properties header, Properties parms, Properties files) {
    /**
    final StringBuilder buf = new StringBuilder();

    for (Entry<Object, Object> kv : header.entrySet()) {
      buf.append(kv.getKey() + " : " + kv.getValue() + "\n");
    }

    handler.post(new Runnable() {
      @Override
      public void run() {
        hello.setText(buf);
      }
    });
    **/

    final String html = "<html><head><head><body><h1>Hello, World</h1></body></html>";
    return new NanoHTTPD.Response(HTTP_OK, MIME_HTML, html);
  }
}
