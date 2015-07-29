/**
 * gulpfile for colony
 *
 * Here are the common tasks used:
 * build
 * - Lint and compile
 * - (default Grunt task)
 * test
 *  - Run all tests
 * jsdoc
 *  - Generate jsdoc documentation
 **/
var gulp = require("gulp");
var gulpSequence = require("gulp-sequence");
var fs = require("fs-extra");
var jshint = require("gulp-jshint");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var pkgify = require("pkgify");
var path = require("path");
var spawn = require("child_process").spawn;

gulp.task("build_provision", function() {
  "use strict";
  var entry = path.join(__dirname, './client/www/js/provision.js');
  var filename = path.basename(entry);
  var bundle = function() {
    return browserify({
      debug: true
    }).transform(pkgify, {
      packages: {
        request: path.relative(__dirname, require.resolve("browser-request"))
      },
      relativeTo: __dirname,
      global: true
    }).require(entry, {expose: 'provision'})
      .bundle()
      .pipe(source(filename))
      .pipe(buffer())
      .pipe(gulp.dest("./client/www/build/"));
  };
  return bundle();
});

gulp.task('copy_forge_min', function(){
  "use strict";
  gulp.src('./node_modules/forge-min/forge.min.js')
    .pipe(gulp.dest('./client/www/build/'));
});

gulp.task('build_chrome_app', ['build_provision', 'copy_forge_min'], function() {
  'use strict';
  // Copy all relevant files to client/build/chrome-app
  gulp.src([
    './client/chrome-app/background.js',
    './client/chrome-app/index.html',
    './client/chrome-app/manifest.json',
    ]).pipe(gulp.dest('./client/build/chrome-app/'));
  gulp.src([
      './client/www/build/provision.js',
      './client/www/build/forge.min.js',
      './node_modules/freedom-for-chrome/freedom-for-chrome.js'
    ]).pipe(gulp.dest('./client/build/chrome-app/js/'));
  gulp.src('./client/www/css/index.css')
    .pipe(gulp.dest('./client/build/chrome-app/css/'));
  gulp.src('./client/www/img/*')
    .pipe(gulp.dest('./client/build/chrome-app/img/'));

  // Browserify client/chrome-app/index.js  
  browserify('./client/chrome-app/index.js', {debug: true})
    .transform(pkgify, {
      packages: {
        'request': path.relative(__dirname, require.resolve("browser-request")),
        'net': path.relative(__dirname, './client/chrome-app/lib/net.js'),
        'dns': path.relative(__dirname, './client/chrome-app/lib/dns.js'),
        'node-stringprep': path.relative(__dirname, './client/chrome-app/lib/stringprep.js'),
        'tls-connect': path.relative(__dirname, './client/chrome-app/lib/tlsconnect.js')
        // crypto: path.relative(__dirname, require.resolve("crypto-browserify"))
      },
      relativeTo: __dirname,
      global: true
    })
    .bundle()
    .pipe(source('index-bundle.js'))
    .pipe(gulp.dest('./client/build/chrome-app'));
});

gulp.task("lint", function() {
  "use strict";
  return gulp.src([
      "*.json",
      "*.js",
      "client/www/**/*.js",
      "client/plugin-src/**/*.js",
      "!client/www/build/**",
    ]).pipe(jshint({ lookup: true }))
    .pipe(jshint.reporter("default"));
});

var cordovaTask = function(args, cb) {
  "use strict";
  var proc = spawn(require.resolve("cordova/bin/cordova"), args, {
    cwd: "client/build"
  });
  proc.stdout.on('data', function (data) {
    console.log(data.toString().trim());
  });
  proc.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  proc.on('close', function (code) {
    console.log('child process exited with code ' + code);
    cb(code);
  });
};
gulp.task("cordova_create", function(cb) {
  "use strict";
  spawn(
    require.resolve("cordova/bin/cordova"), 
    [ "create", "build", "org.uproxy.colony", "Colony" ], 
    { cwd: "client" }
  ).on("close", function(code) { cb(); });
});
gulp.task("cordova_platform_android", cordovaTask.bind({}, [ "platform", "add", "android" ]));
gulp.task("cordova_plugin_oauthredirect", cordovaTask.bind({}, [ "plugin", "add", "client/plugin-src/cordova-plugin-oauthredirect/", "--link", "--noregistry" ]));
gulp.task("cordova_plugin_openvpn", cordovaTask.bind({}, [ "plugin", "add", "client/plugin-src/cordova-plugin-openvpn/", "--link", "--noregistry" ]));
gulp.task("cordova_plugin_ssh", cordovaTask.bind({}, [ "plugin", "add", "client/plugin-src/cordova-plugin-ssh/", "--link", "--noregistry" ]));
gulp.task("cordova_build", cordovaTask.bind({}, [ "build" ]));
gulp.task("cordova_emulate", cordovaTask.bind({}, [ "emulate", "android" ]));
gulp.task("setup_www", function(cb) {
  "use strict";
  fs.remove("client/build/www", function() {
    fs.symlink("../www", "client/build/www", cb); 
  });
});

gulp.task("setup", gulpSequence(
  "cordova_create",
  "cordova_platform_android",
  "cordova_plugin_oauthredirect",
  "cordova_plugin_openvpn",
  "cordova_plugin_ssh",
  "setup_www",
  "build_js",
  "cordova_build"
));

gulp.task("build_js", [ "build_provision", "copy_forge_min", "build_chrome_app" ]);
gulp.task("run", gulpSequence("build_js", "cordova_emulate"));
gulp.task("clean", function(cb) { 
  "use strict"; 
  fs.remove("client/www/build");
  fs.remove("client/build", function() { cb(); });
});
gulp.task("test", [ "lint" ]);
gulp.task("default", [ "run", "test" ]);
