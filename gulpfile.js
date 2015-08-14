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
var merge = require('merge-stream');

gulp.task("build_provision", function() {
  "use strict";
  var entry = path.join(__dirname, './client/www/js/provision.js');
  var filename = path.basename(entry);
  var bundle = function() {
    return browserify({
      debug: true
    }).transform(pkgify, {
      packages: {
        // request: path.relative(__dirname, require.resolve("browser-request"))
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

gulp.task('copy_chrome_app', function () {
  'use strict';
  // Copy the module ssh2-streams to client/chrome-app/lib
  // We're replacing some files with slightly modified versions
  var ss1 = gulp.src('./node_modules/ssh2-streams/node_modules/**/*')
    .pipe(gulp.dest('./client/chrome-app/lib/ssh2-streams/node_modules/'));
  var ss2 = gulp.src(['./node_modules/ssh2-streams/index.js',
            './node_modules/ssh2-streams/package.json'
    ]).pipe(gulp.dest('./client/chrome-app/lib/ssh2-streams/'));
  var ss3 = gulp.src(['./node_modules/ssh2-streams/lib/constants.js',
            './node_modules/ssh2-streams/lib/keyParser.js',
            './node_modules/ssh2-streams/lib/utils.js',
    ]).pipe(gulp.dest('./client/chrome-app/lib/ssh2-streams/lib/'));

  // Copy the module socksv5 to client/chrome-app/lib, same reason as above
  var s1 = gulp.src('./node_modules/socksv5/node_modules/**/*')
    .pipe(gulp.dest('./client/chrome-app/lib/socksv5/node_modules/'));
  var s2 = gulp.src('./node_modules/socksv5/package.json')
    .pipe(gulp.dest('./client/chrome-app/lib/socksv5/'));
  var s3 = gulp.src(['./node_modules/socksv5/lib/Agents.js',
            './node_modules/socksv5/lib/client.js',
            './node_modules/socksv5/lib/client.parser.js',
            './node_modules/socksv5/lib/constants.js',
            './node_modules/socksv5/lib/server.parser.js',
            './node_modules/socksv5/lib/utils.js',
    ]).pipe(gulp.dest('./client/chrome-app/lib/socksv5/lib/'));
  var s4 = gulp.src('./node_modules/socksv5/lib/auth/**/*')
    .pipe(gulp.dest('./client/chrome-app/lib/socksv5/lib/auth/'));
  // For some reason these two files are not copied by the above rules
  var s5 = gulp.src('./node_modules/socksv5/node_modules/ipv6/lib/node/bigint.js')
    .pipe(gulp.dest('./client/chrome-app/lib/socksv5/node_modules/ipv6/lib/node/'));
  var s6 = gulp.src('./node_modules/socksv5/node_modules/ipv6/lib/browser/sprintf.js')
    .pipe(gulp.dest('./client/chrome-app/lib/socksv5/node_modules/ipv6/lib/browser/'));

  // Copy all relevant files to client/build/chrome-app
  var c1 = gulp.src([
    './client/chrome-app/background.js',
    './client/chrome-app/index.html',
    './client/chrome-app/manifest.json',
    './client/chrome-app/index.js',
    './client/chrome-app/freedom-ssh.json',
    ]).pipe(gulp.dest('./client/build/chrome-app/'));
  var c2 = gulp.src([
      './node_modules/forge-min/forge.min.js',
      './node_modules/freedom-for-chrome/freedom-for-chrome.js'
    ]).pipe(gulp.dest('./client/build/chrome-app/js/'));
  var c3 = gulp.src('./client/www/css/index.css')
    .pipe(gulp.dest('./client/build/chrome-app/css/'));
  var c4 = gulp.src('./client/www/img/*')
    .pipe(gulp.dest('./client/build/chrome-app/img/'));

  // return merge() is necessary so this finishes synchronously
  return merge(ss1, ss2, ss3, s1, s2, s3, s4, s5, s6, c1, c2, c3, c4);
});

gulp.task('browserify_chrome_app', function () {
  // Browserify client/chrome-app/freedom-ssh.js  
  // TODO(kennysong): Figure out how to only replace the relevant files with
  // pkgify instead of copying the entire module
  var freedomSsh = browserify('./client/chrome-app/freedom-ssh.js', {debug: true})
    .transform(pkgify, {
      packages: {
        'request': path.relative(__dirname, require.resolve("browser-request")),
        'net': path.relative(__dirname, './client/chrome-app/lib/net.js'),
        'dns': path.relative(__dirname, './client/chrome-app/lib/dns.js'),
        'ssh2-streams': path.relative(__dirname, './client/chrome-app/lib/ssh2-streams'),
        'socksv5': path.relative(__dirname, './client/chrome-app/lib/socksv5'),
      },
      relativeTo: __dirname,
      global: true
    })
    .bundle()
    .pipe(source('freedom-ssh-bundle.js'))
    .pipe(gulp.dest('./client/build/chrome-app'));

  // Browserify client/chrome-app/index.js  
  var index = browserify('./client/chrome-app/index.js', {debug: true})
    .transform(pkgify, {
      packages: {
        'request': path.relative(__dirname, require.resolve("browser-request"))
      },
      relativeTo: __dirname,
      global: true
    })
    .bundle()
    .pipe(source('index-bundle.js'))
    .pipe(gulp.dest('./client/build/chrome-app'));

  return merge(freedomSsh, index);
});

gulp.task('build_chrome_app', gulpSequence('copy_chrome_app', 'browserify_chrome_app'));

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
  // Remove the extra node module files in chrome-app/lib
  fs.remove('./client/chrome-app/lib/ssh2-streams/node_modules/');
  fs.remove('./client/chrome-app/lib/ssh2-streams/index.js');
  fs.remove('./client/chrome-app/lib/ssh2-streams/package.json');
  fs.remove('./client/chrome-app/lib/ssh2-streams/lib/constants.js');
  fs.remove('./client/chrome-app/lib/ssh2-streams/lib/keyParser.js');
  fs.remove('./client/chrome-app/lib/ssh2-streams/lib/utils.js');
  fs.remove('./client/chrome-app/lib/socksv5/node_modules/');
  fs.remove('./client/chrome-app/lib/socksv5/package.json');
  fs.remove('./client/chrome-app/lib/socksv5/lib/Agents.js');
  fs.remove('./client/chrome-app/lib/socksv5/lib/client.js');
  fs.remove('./client/chrome-app/lib/socksv5/lib/client.parser.js');
  fs.remove('./client/chrome-app/lib/socksv5/lib/constants.js');
  fs.remove('./client/chrome-app/lib/socksv5/lib/server.parser.js');
  fs.remove('./client/chrome-app/lib/socksv5/lib/utils.js');
  fs.remove('./client/chrome-app/lib/socksv5/lib/auth/');
  fs.remove('./client/chrome-app/lib/socksv5/node_modules/ipv6/lib/node/');
  fs.remove('./client/chrome-app/lib/socksv5/node_modules/ipv6/lib/browser/');

  // Remove the build folders
  fs.remove("client/www/build");
  fs.remove("client/build", function() { cb(); });
});
gulp.task("test", [ "lint" ]);
gulp.task("default", [ "run", "test" ]);
