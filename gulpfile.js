const {src, dest, watch, parallel, series } = require('gulp');
const svgmin = require('gulp-svgmin');
const svgo = require('svgo');
const sprite = require('gulp-svg-sprite');
const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const mqpacker = require('css-mqpacker');
const sortCSSmq = require('sort-css-media-queries');
const postcssMergeRules = require('postcss-merge-rules');

const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const rename = require('gulp-rename');
// const nunjucksRender = require('gulp-nunjucks-render');
const del = require('del');
const browserSync = require('browser-sync').create();


function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'app/'
		},
		notify: false
	})
}

function styles() {
	return src('app/scss/*.scss')
	.pipe(scss())
	// .pipe(concat())
	.pipe(rename({
		suffix: '.min',
	}))
	.pipe(postcss([
		autoprefixer({
			overrideBrowserslist: ['last 10 versions'],
			grid: true,
		}),
		mqpacker({
			sort: sortCSSmq
		  }),
		postcssMergeRules()
	]))
	.pipe(dest('app/css'))
	.pipe(browserSync.stream())
}

function images() {
	return src('app/images/**/*.*')
	.pipe(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.mozjpeg({quality: 75, progressive: true}),
		imagemin.optipng({optimizationLevel: 5}),
		imagemin.svgo({
			plugins: [
				{removeViewBox: true},
				{cleanupIDs: false}
			]
		})
	]))
	.pipe(dest('docs/images'))
}

function scripts() {
	return src ([
		'node_modules/jquery/dist/jquery.js',
		'node_modules/slick-carousel/slick/slick.js',
		'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js',
		'node_modules/rateyo/src/jquery.rateyo.js',
		'node_modules/ion-rangeslider/js/ion.rangeSlider.js',
		'node_modules/jquery-form-styler/dist/jquery.formstyler.js',
		'app/js/main.js'
	])
	.pipe(concat('main.min.js'))
	.pipe(uglify())
	.pipe(dest('app/js'))
	.pipe(browserSync.stream())
}

function build() {
	return src([
		'app/*.html',
		'app/css/*.css',
		'app/js/main.min.js',
		'app/fonts/*'
	], {base: 'app'})
	.pipe(dest('docs'))
}

function cleanDocs() {
	return del('docs')
}

function watching() {
	watch(['app/**/*.scss'], styles);
	// watch(['app/*.njk'], nunjucks);
	watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
	watch(['app/**/*.html']).on('change', browserSync.reload);

}

function svg_sprite() {
	del('app/images/sprite.svg');
	return src('app/images/icons/**/*.svg')
		.pipe(sprite({
			mode: {
				stack: {
					sprite: '../sprite.svg'
				}
			}
		}))
		.pipe(svgmin({
			multipass: true,
			js2svg: {
				pretty: true,
				indent: 2,
			},
			plugins: [
				{
					name: "removeAttrs",
					params: {
					attrs: "[fill]",
					}
				}
			  ]
		}))
		.pipe(dest('app/images'))
}

exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.cleanDocs = cleanDocs;
// exports.svg_sprite = svg_sprite;
exports.build = series(cleanDocs, svg_sprite, images, build);

exports.default = parallel(styles, svg_sprite, scripts, browsersync, watching);
