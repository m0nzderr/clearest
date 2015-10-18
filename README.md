# Clearest Framework (WIP) [![Build Status](https://travis-ci.org/m0nzderr/clearest.svg?branch=2.0.0-wip)](https://travis-ci.org/m0nzderr/clearest)
This is another front-end development framework for NodeJS.
Despite of being created recently, the project already had a couple of years of mileage in highly complex projects.

Its previous versions were closed-source and based on a combination of XSLT with other custom-built tools. Today it is being re-implemented to stay within NodeJS ecosystem. 

The WIP is going towards its first open-source release of v2.0. Hopefully, one may find in it an alternative to other MVC front-end frameworks like AngularJS and RecatJS. 

Features:
* Designed for development of modular MVC/MVVM apps with minimal coding effort;
* Provides high-level, abstract, XML-based language for component development;
* Almost everything is done with a dozen of XML tags around your code;
* Compliable into reusable JavaScript modules (no parsing at runtime);
* No struggle with custom components or existing libs - it'll work with just anything you can require("...") and browsetify;
* Small-footprint runtime library of essentials (only depends on Q), other convinient features like hash navigation and REST resources are only used as require()'ed;
* Ready to merge into your gulp workflow out of the box;

More code and docs are coming soon.




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

	
