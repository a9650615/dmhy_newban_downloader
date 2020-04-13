var gulp = require("gulp");
var babel = require("gulp-babel");
var connect = require("gulp-connect");
var shelljs = require("shelljs");

gulp.task("connect", function () {
 connect.server({
    root: 'web',
    livereload: true
  });
});

gulp.task("reload", function () {
	shelljs.exec('node ./dist/index.js', {
    	async: true
  	});
  return gulp.src(["index.js","app/**"])
    .pipe(babel())
    .pipe(gulp.dest("dist"))
    .pipe(connect.reload());;
});

gulp.task('watch', function () {
	gulp.watch([
    'index.js',
		'app/**',
		'index.html'
	], ['reload']);
});

gulp.task('default', ['connect', 'watch','reload']);