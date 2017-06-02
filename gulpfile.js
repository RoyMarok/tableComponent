
var gulp = require('gulp');
var stylus = require('gulp-stylus');
var watch = require('gulp-watch');

gulp.task('default', function() {
  return gulp.src('./*.styl')
    .pipe(watch('./*.styl'))
    .pipe(stylus())
    .pipe(gulp.dest('./'));
});
