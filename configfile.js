/*项目配置文件*/

const config = {
    "env": "development",
    "template": "template.html",
    "includejs": [
        "./lib/scripts/zepto.min.js",
        "./lib/scripts/zepto.fx.js",
        "./lib/scripts/zepto.fx_methods.js"
    ],
    "includecss": [
        "./lib/scsss/base/common-2.1.scss"
    ],
    "babel": {
        "presets": ["es2015"]
    },
    "autoprefixer": {
        "browsers": ["last 3 versions", "> 1%"]
    },
    "pxtorem": {
        "rootValue": 46.875, //750/320*20 默认设计稿大小为750
        "unitPrecision": 5,
        "propList": ["*", "!font-size"],
        "selectorBlackList": [],
        "replace": true,
        "mediaQuery": false,
        "minPixelValue": 0
    }
}

module.exports = config;
