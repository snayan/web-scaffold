const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const pxtorem = require('postcss-pxtorem');
module.exports = (plugins, config) => {
    /*是否是线上环境*/
    let ispro = config.env === 'production' || process.env.NODE_ENV === 'production';
    return {
        scsss: (stream) => {
            let postcsss = [
                autoprefixer(config.autoprefixer),
                pxtorem(config.pxtorem)
            ]
            if (ispro) {
                postcsss.push(cssnano());
            }
            stream = stream.pipe(plugins.sass().on('error', plugins.sass.logError));
            stream = stream.pipe(plugins.postcss(postcsss));
            return stream;
        },
        scripts: (stream) => {
            stream = stream.pipe(plugins.babel(config.babel));
            if (ispro) {
                stream = stream.pipe(plugins.uglify())
            }
            return stream;
        },
        images: (stream) => {
            if (ispro) {
                // stream = stream.pipe(plugins.imagemin());
            }
            return stream;
        },
        htmls: (stream) => {
            if (ispro) {
                stream = stream.pipe(plugins.htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true }));
            }
            return stream;
        }
    }
}
