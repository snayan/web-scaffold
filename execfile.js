/*gulp 执行的一些命令，用于初始化项目*/

const fs = require('fs');
const path = require('path');

/*检测是否已存在项目*/
function exitProgram(name) {
    return fs.existsSync(name);
}

/*创建文件夹*/
function createDir(name) {
    return new Promise((resolve, reject) => {
        fs.mkdir(name, (err) => {
            err ? reject(err) : resolve();
        })
    })
}

/*创建文件*/
function createFile(name, content) {
    return new Promise((resolve, reject) => {
        if (!name || typeof name != 'string') {
            reject(new Error(`${name} is not a valid file path`));
        }
        let stream = fs.createWriteStream(name);
        if (content) {
            stream.end(content);
        };
        stream.on('finish', () => {
            return resolve();
        });
        stream.on('error', (err) => {
            return reject(err);
        })
    })
}

/*创建初始化项目配置文件*/
function getConfigFileTemp() {
    let config = {
        "index.html": {
            "title": "页面标题",
            "keywords": "页面关键字",
            "description": "页面描述"
        },
        "env": "production",
        "dest": "build",
        "vendor": {
            "js": "build/scripts",
            "css": "build/scsss"
        }
    }
    return `const config = ${JSON.stringify(config, null, '  ')}
module.exports = config;
`
}

/*创建初始化index.html*/
function getIndexHtml() {
    let html = `<link src="scsss/index.scss" type="include" />
<div class="main">
    here your content
</div>
<script src="scripts/index.js" type="include" />`;
    return html;
}

module.exports = (gulp, plugins, config) => () => {
    let dirname = config.dirname;
    let resolve = (fileName) => path.resolve(dirname, fileName);
    gulp.task('new', () => {
        if (exitProgram(dirname)) {
            return gulp.log.error(`${dirname} already exit`)
        }
        createDir(dirname).then(() => {
                let dirs = ['scripts', 'images', 'scsss'].map(v => createDir(resolve(v)));
                console.log(resolve('scripts'));
                return Promise.all(dirs)
            })
            .then(() => {
                let files = [
                    createFile(resolve('configfile.js'), getConfigFileTemp()),
                    createFile(resolve('index.html'), getIndexHtml()),
                    createFile(resolve('scripts/index.js'), 'console.log("hello world")'),
                    createFile(resolve('scsss/index.scss'), '')
                ]
                return Promise.all(files);
            })
            .catch((err) => {
                return gulp.log.error(`create program error:${err && err.message?err.message:err}`);
            })
    })
}
