/**
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    обьявляем переменные и зависимости
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
*/

var gulp         = require('gulp');
var jade         = require('gulp-jade');
var imagemin     = require('gulp-imagemin');
var sass         = require('gulp-sass');
var minifyCSS    = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var spritesmith  = require('gulp.spritesmith');
var uglify       = require('gulp-uglify');
var prettify     = require('gulp-prettify');
var browserSync  = require('browser-sync');
var reload       = browserSync.reload;

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: "./html/public"
        }
    });
});

gulp.task('reload', function () {
    browserSync.reload();
});

gulp.task('jade', function(){
    gulp.src('./html/dev/jade/!(_)*.jade')
        .pipe(jade({
            pretty: true
        }))
        .on('error', console.log)
        .pipe(prettify({
            indent_size: 4,
            unformatted: ['pre', 'code']
        }))
        .pipe(gulp.dest('./html/public'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('imagemin',function(){
    return gulp.src('./html/dev/opt_img/**')
        .pipe(imagemin({ progressive: true }))
        .pipe(gulp.dest('./html/public/img/'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('sass', function () {
    gulp.src(['./html/dev/scss/*.scss'])
        .pipe(sass({
            outputStyle: 'nested'
        }))
        .pipe(autoprefixer('last 2 version',
            'safari 5',
            'ie 8',
            'ie 9',
            'opera 12.1',
            'ios 6',
            'android 4'
        ))
        .pipe(gulp.dest('./html/public/css/full'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('minify-css', function() {
    return gulp.src('./html/public/css/full/*.css')
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest('./html/public/css/'))
});

gulp.task('watch', function () {
    gulp.watch('./html/dev/scss/**/*.scss', ['sass']);
    gulp.watch('./html/public/css/full/*.css', ['minify-css']);
    gulp.watch('./html/public/js/**/*.js', ['reload']);
    gulp.watch('./html/dev/jade/**/*.jade', ['jade']);
    gulp.watch('./html/dev/opt_img/**',['imagemin']);
});

gulp.task('default',
    [
        'watch',
        'imagemin',
        'sass',
        'minify-css',
        'jade',
        'browser-sync'
    ]
);
