cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-whitelist/whitelist.js",
        "id": "cordova-plugin-whitelist.whitelist",
        "runs": true
    },
    {
        "file": "plugins/cordova-plugin-oauthredirect/oauthredirect.js",
        "id": "cordova-plugin-oauthredirect.oauthredirect",
        "clobbers": [
            "oauthredirect"
        ]
    },
    {
        "file": "plugins/cordova-plugin-openvpn/openvpn.js",
        "id": "cordova-plugin-openvpn.openvpn",
        "clobbers": [
            "openvpn"
        ]
    },
    {
        "file": "plugins/cordova-plugin-ssh/ssh.js",
        "id": "cordova-plugin-ssh.ssh",
        "clobbers": [
            "sshclobber"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.0.0",
    "cordova-plugin-oauthredirect": "1.0.0",
    "cordova-plugin-openvpn": "1.0.0",
    "cordova-plugin-ssh": "1.0.0"
}
// BOTTOM OF METADATA
});