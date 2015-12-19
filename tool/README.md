# Usage (draft)

## Gulp

```javascript
"use strict"
var browserify = require('browserify'),
    clearest = require('../../'),
    prettify = require('gulp-jsbeautifier'),
    gulp = require('gulp');

var setup = {
	compile:'src/**/*.xml',           // clearest files to compile
	output:'temp',	                  // all .xml's will be compiled here into corresponding .tpl.js files
	render:'temp/**/*.page.tpl.js',   // render all pages in "html" directory
	target:'dist',		          // bundled output
	watch: true                       // watch
    };

// compiler pipeline
gulp.task('clearest-compile', function() {
  return gulp.src(setup.compile)
	.pipe(clearest.compiler({verbose:true}))
	.pipe(prettify()) // helps for reading/debugging generated code
	.pipe(gulp.dest(setup.output));
});

// static rendering pipeline
gulp.task('clearest-render', ['clearest-compile'], function() {
  return gulp.src(setup.render)
	 .pipe(clearest.renderer({verbose:true})) // will produce .html files and .bundle.js
	.pipe(gulp.dest(setup.target));
});
```

### Notes
Use gulp-jsbeautifier instead of gulp-js-prettify (it breaks with apparent utf8 problems).


