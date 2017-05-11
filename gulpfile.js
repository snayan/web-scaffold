const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const chalk = require('chalk');
const cheerio = require('cheerio');
const through2 = require('through2');
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const revHash = require('rev-hash');
const sortKeys = require('sort-keys');
const del = require('del');
const StringDecoder = require('string_decoder').StringDecoder;
const baseConfig = require('./configfile.js');

/*日志输出*/
const log = {
    log: (...msg) => {
        console.log(chalk.green(msg.join(' ')));
    },
    ware: (...msg) => {
        console.log(chalk.yellow(msg.join(' ')));
    },
    error: (...msg) => {
        console.log(chalk.red.bold(msg.join(' ')));
        process.exit(-1);
    }
}

gulp.log = log;

/*解决window平台下路径问题*/
const pri_relative = path.relative;
path.relative = (form, to) => {
    let filePath = pri_relative(form, to);
    return filePath.replace(/\\/g, '/');
}

/*空字符串或空数组判断*/
const validEmpty = (s, t) => {
    if (!s || !s.length) {
        return log.error('empty params', `${t} can not be empty`);
    }
    return true;
}

/*获取文件名称*/
const getFileName = (filePath) => {
    let {
        name,
        ext
    } = path.parse(filePath);
    return name + ext;
}

/*读取文件内容*/
const readFileContent = (filePath) => {
    let content = '';
    if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, {
            encoding: 'utf8'
        });
    }
    return content;
}

/*指令参数信息获取*/
const args = yargs.usage('Usage: $0 -d [dirname]')
    .example('gulp -d someDirName -p')
    .options('d', {
        alias: 'dirname',
        demandOption: true,
        type: 'string'
    })
    .alias('p', 'production')
    .describe('d', 'dirname')
    .describe('p', 'production environment')
    .command('clean', 'clean dirname')
    .command('compress', 'compress dirname')
    .command('new', 'create a new program')
    .argv;

let config = Object.assign({}, baseConfig, {
    dirname: args.d + ''
});

let isNewCommand = args._.length && args._[0] === 'new';
let target = path.resolve(process.cwd(), config.dirname);
if (!fs.existsSync(target) && !isNewCommand) {
    log.error(`${target} is not exits`);
}
if (isNewCommand && fs.existsSync(target)) {
    log.error(`${target} already exit`);
}
let targetConfig = path.resolve(target, 'configfile.js');
if (fs.existsSync(targetConfig)) {
    let subConfig = require(targetConfig);
    if (subConfig.hasOwnProperty('template')) {
        subConfig.template = path.resolve(target, subConfig.template);
    }
    if (subConfig.hasOwnProperty('dest')) {
        subConfig.dest = path.resolve(target, subConfig.dest);
    }
    if (subConfig.hasOwnProperty('includejs')) {
        subConfig.includejs = subConfig.includejs.map(p => path.resolve(target, p));
        if (config.hasOwnProperty('includejs')) {
            subConfig.includejs = config.includejs.concat(subConfig.includejs);
        }
    }
    if (subConfig.hasOwnProperty('includecss')) {
        subConfig.includecss = subConfig.includecss.map(p => path.resolve(target, p));
        if (config.hasOwnProperty('includecss')) {
            subConfig.includecss = config.includecss.concat(subConfig.includecss);
        }
    }
    if (subConfig.hasOwnProperty('vendor')) {
        if (subConfig.vendor.hasOwnProperty('js')) {
            subConfig.vendor.js = path.resolve(target, subConfig.vendor.js);
        }
        if (subConfig.vendor.hasOwnProperty('css')) {
            subConfig.vendor.css = path.resolve(target, subConfig.vendor.css);
        }
    }
    config = Object.assign({}, config, require(targetConfig))
}
if (args.p) {
    config.env = 'production';
}

const gulpTasks = require('./gulptasks.js')(plugins, config);

/*创建style引用节点*/
const createIncludeLinkDom = (filePath) => filePath && `<link type="text/css" href="${filePath}" rel="stylesheet" />`;

/*创建style内联节点*/
const createInlineLinkDom = (content) => content && `<style type="text/css">${content}</style>`;

/*创建script引用节点*/
const createIncludeScriptDom = (filePath) => filePath && `<script type="text/javascript" src="${filePath}" />`;

/*创建script内联节点*/
const createInlineScriptDom = (content) => content && `<script>${content}</script>`

/*是否是线上环境*/
const ispro = config.env === 'production' || process.env.NODE_ENV === 'production';

/*输出一些环境信息*/
!isNewCommand && (function () {
    log.log(`env:${config.env}`);
    log.log(`dir:${path.relative(process.cwd(),target)}`);
    log.log(`dest:${path.relative(process.cwd(),config.dest)}`);
}());

/*生成文件版本*/
let manifest = {};
const revFile = () => {
    let mp = path.resolve(target, 'manifest.json');
    return through2.obj((file, enc, callback) => {
        if (file.isNull() || file.isStream() || !file.path) {
            return callback(null, file);
        }
        manifest[path.relative(target, file.path)] = revHash(file.contents);
        let wr = fs.createWriteStream(mp);
        wr.end(new Buffer(JSON.stringify(sortKeys(manifest), null, '  ')));
        wr.on('finish', () => {
            return callback(null, file);
        });
    })
};

/*gulp task:scss编译*/
function scsss(src, dest) {
    validEmpty(src, 'scss:src');
    validEmpty(dest, 'scss:dest');
    return gulp.task('scsss', () => {
        let stream = gulp.src(src);
        if (!ispro) {
            stream = stream.pipe(plugins.sourcemaps.init());
        }
        stream = gulpTasks.scsss(stream);
        if (!ispro) {
            stream = stream.pipe(plugins.sourcemaps.write('.'));
        }
        stream = stream.pipe(gulp.dest(dest));
        return stream;
    });
}

/*gulp task:script编译*/
function scripts(src, dest) {
    validEmpty(src, 'scripts:src');
    validEmpty(dest, 'scripts:dest');
    return gulp.task('scripts', () => {
        let stream = gulp.src(src);
        if (!ispro) {
            stream = stream.pipe(plugins.sourcemaps.init());
        }
        stream = gulpTasks.scripts(stream);
        if (!ispro) {
            stream = stream.pipe(plugins.sourcemaps.write('.'));
        }
        stream = stream.pipe(gulp.dest(dest));
        return stream;
    });
}

/*gulp task:images编译*/
function images(src, dest) {
    validEmpty(src, 'images:src');
    validEmpty(dest, 'images:dest');
    return gulp.task('images', () => {
        let stream = gulp.src(src);
        stream = gulpTasks.images(stream);
        stream = stream.pipe(gulp.dest(dest));
        return stream;
    });
}

/*gulp task:html编译*/
function htmls(src, dest) {
    validEmpty(src, 'htmls:src');
    validEmpty(dest, 'htmls:dest');
    return gulp.task('htmls', () => {
        let stream = gulp.src(src);
        stream = stream.pipe(parseHtmls());
        stream = gulpTasks.htmls(stream);
        stream = stream.pipe(gulp.dest(dest));
        return stream;
    });
}

/*解析生成html文件*/
function parseHtmls() {
    let style_reg = /<link\s+.*?\s+\/>/gim;
    let script_reg = /<script\s+.*?\s+\/>/gim;
    let src_reg = /src\s*=\s*"(.*?)"/i;
    let type_reg = /type\s*=\s*"(.*?)"/i;
    let template = readFileContent(path.resolve(config.template));
    let $ = cheerio.load(template);
    return through2.obj((file, enc, callback) => {
        if (file.isNull()) {
            return callback(null, file);
        }
        let decoder = new StringDecoder('utf8');
        let fileName = getFileName(file.path);
        let fileMeta = config[fileName] || {};
        let fileContent = decoder.end(decoder.write(file.contents));
        let style_inline = [],
            style_include = [],
            script_inline = [],
            script_include = [];
        let scriptCompplete = false,
            styleComplete = false;
        fileContent = fileContent.replace(style_reg, (style, index, self) => {
            if (style.match(type_reg)[1] === 'inline') {
                style_inline.push(path.resolve(path.dirname(file.path), style.match(src_reg)[1]))
            } else {
                style_include.push(style.match(src_reg)[1].replace(/scss$/, 'css'));
            }
            return '';
        })
        fileContent = fileContent.replace(script_reg, (script, index, self) => {
            if (script.match(type_reg)[1] === 'inline') {
                script_inline.push(path.resolve(path.dirname(file.path), script.match(src_reg)[1]))
            } else {
                script_include.push(script.match(src_reg)[1])
            }
            return '';
        })
        $('title').text(fileMeta.title || '');
        $('meta[name="keywords"]').attr('content', fileMeta.keywords || '');
        $('meta[name="description"]').attr('content', fileMeta.description || '');
        $('body').html(fileContent);
        style_inline.length && $('head').append(style_inline.map(style => createInlineLinkDom(readFileContent(style))).join('\n'));
        script_inline.length && $('head').append(script_inline.map(script => createInlineScriptDom(readFileContent(script))).join('\n'));
        parseScripts([], (err, filePath) => {
            if (err) {
                log.error('parse scripts error', err.message);
            }
            scriptCompplete = true;
            if (filePath) {
                filePath = path.relative(path.resolve(target, config.dest), filePath);
                $('head').append(createIncludeScriptDom(filePath));
            }
            script_include.length && $('body').append(script_include.map(filePath => createIncludeScriptDom(filePath)).join('\n'));
            if (styleComplete) {
                file.contents = new Buffer($.html());
                return callback(null, file);
            }
        });
        parseCsss([], (err, filePath) => {
            if (err) {
                log.error('parse styles error', err.message);
            }
            styleComplete = true;
            if (filePath) {
                filePath = path.relative(path.resolve(target, config.dest), filePath);
                $('head').append(createIncludeLinkDom(filePath));
            }
            style_include.length && $('head').append(style_include.map(filePath => createIncludeLinkDom(filePath)).join('\n'));
            if (scriptCompplete) {
                file.contents = new Buffer($.html());
                return callback(null, file);
            }
        });
    })
}

/*解析公共引用的js文件，合并为一个vendor.js*/
function parseScripts(scripts, callback) {
    !Array.isArray(scripts) && (scripts = [scripts]);
    scripts = scripts.concat(config.includejs);
    if (!scripts.length) {
        return callback(null);
    }
    let isExits = scripts.reduce((isExits, script) => isExits || fs.existsSync(script), false);
    if (!isExits) {
        return callback(null);
    }
    let stream = gulp.src(scripts);
    let dest = config.vendor && config.vendor.js;
    dest = dest || path.resolve(target, config.dest, 'vendor');
    if (!ispro) {
        stream = stream.pipe(plugins.sourcemaps.init());
    }
    stream = gulpTasks.scripts(stream);
    stream = stream.pipe(plugins.concat('vendor.js'), {
        newLine: ';'
    });
    if (!ispro) {
        stream = stream.pipe(plugins.sourcemaps.write('.'));
    }
    stream = stream.pipe(gulp.dest(dest));
    stream.on('end', () => {
        callback(null, path.resolve(dest, 'vendor.js'));
    }).on('error', (err) => {
        callback(err);
    })
}

/*解析公共引用的css文件，合并为一个vendor.css*/
function parseCsss(styles, callback) {
    !Array.isArray(styles) && (styles = [styles]);
    styles = styles.concat(config.includecss);
    if (!styles.length) {
        return callback(null);
    }
    let isExits = styles.reduce((isExits, style) => isExits || fs.existsSync(style), false);
    if (!isExits) {
        return callback(null);
    }
    let stream = gulp.src(styles);
    let dest = config.vendor && config.vendor.css;
    dest = dest || path.resolve(target, config.dest, 'vendor');
    if (!ispro) {
        stream = stream.pipe(plugins.sourcemaps.init());
    }
    stream = gulpTasks.scsss(stream);
    stream = stream.pipe(plugins.concat('vendor.css'));
    if (!ispro) {
        stream = stream.pipe(plugins.sourcemaps.write('.'));
    }
    stream = stream.pipe(gulp.dest(dest));
    stream.on('end', () => {
        callback(null, path.resolve(dest, 'vendor.css'));
    }).on('error', (err) => {
        callback(err);
    })
}

let tasks = {
    scripts,
    scsss,
    images,
    htmls
};

/*自动化添加gulp task*/
!isNewCommand && (['scripts', 'scsss', 'images', 'htmls'].forEach(fn => {
    let src = path.resolve(target, fn);
    let dest = path.resolve(target, config.dest, fn);
    switch (fn) {
        case "scripts":
            src = path.resolve(src, '**', '*.js');
            break;
        case "scsss":
            src = path.resolve(src, '**', '*.scss');
            break;
        case "images":
            src = path.resolve(src, '**', '*.png');
            break;
        case "htmls":
            src = path.resolve(target);
            dest = path.resolve(target, config.dest);
            src = path.resolve(src, '**', '*.html');
            break;
        default:
            src = path.resolve(src, '**', '*.*');
            break;
    }
    src = [src, `!${path.resolve(target,'package','**')}`];
    tasks[fn].call(global, src, dest);
}));

/*删除build*/
!isNewCommand && del.sync(path.resolve(target, config.dest));

/*build 任务*/
gulp.task('default', Object.keys(tasks), () => {
    gulp.src(path.resolve(target, config.dest, '**', '*.*'))
        .pipe(revFile())
    setImmediate(log.log.bind(global, 'congratulations,compile success'))
});

/*clean 任务*/
gulp.task('clean', () => {
    del(path.resolve(target));
});

/*compress 任务*/
gulp.task('compress', ['default'], () => {
    gulp.src([path.resolve(target, config.dest, '**', "*")])
        .pipe(plugins.zip(`${config.dirname}.zip`))
        .pipe(gulp.dest(path.resolve(target, 'package')));
});

/*新建项目命令*/
/*gulp new -d programName*/
require('./execfile.js')(gulp, plugins, config)();