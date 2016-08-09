# uProxy Colony / 天空之城
[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/UWNetworksLab/colony)

Colony is a mobile app that deploys a proxy/VPN server to a cloud provider
and autoconfigures the mobile OS to use the proxy.
Future features include the ability to share access to the proxy with friends,
and a variety of platforms.

## Dependencies
Make sure you have the following installed and on your path
- [Node.js](https://nodejs.org/)
- [Android SDK](https://developer.android.com/sdk/installing/index.html)

Note: You will need to install the required android packages by running ```android```.
You'll also need to either plug in an Android device or setup an emulator (```android avd```)

Then install the following from npm

    npm install -g cordova
    npm install -g gulp

## Setup

### OpenVPN plugin setup

The OpenVPN plugin depends on a library version of OpenVPN for Android. Clone the [library](https://github.com/albertolalama/android-openvpn-lib), and follow the [instructions](https://github.com/albertolalama/android-openvpn-lib/blob/master/doc/README.txt) to build it. Copy the output ```.aar``` file into ```client/plugin-src/cordova-plugin-openvpn/openvpnlib.aar```.

### Project setup

These commands only need to be run once

    npm install
    gulp setup

If you mess up and want to wipe the cordova workspace:

    gulp clean


## Develop
From the top-level directory, the default gulp task will lint, build, and run an emulator

    gulp

With the previous commands, you'll now have a cordova workspace at ```client/build/```
When you change into this directory, you can directly run the following commands:
- ```cordova build``` - Build the Android package
- ```cordova emulate android``` - This will build and load the package into Android device/emulator

