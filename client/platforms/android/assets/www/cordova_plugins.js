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
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.0.0",
    "cordova-plugin-oauthredirect": "1.0.0"
}
// BOTTOM OF METADATA
});