[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
# Clearest Framework

This is another front-end development framework for NodeJS.
Despite of being created recently, the project already had a couple of years of mileage in highly complex projects.

Its previous versions were closed-source and based on a combination of XSLT with other custom-built tools. Today it is being re-implemented to stay within NodeJS ecosystem. 

The WIP is going towards its first open-source release of v2.0.0. Hopefully, one may find in it resembling (in some aspects) to other MVC front-end frameworks like AngularJS and ReactJS.

Features:
* Designed for development of modular MVC/MVVM apps with minimal coding effort;
* Provides high-level, abstract, XML-based language for component development. Almost everything is done with a dozen of XML tags.
* 99% of code is browser-independent (no DOM needed to to run its core behind the scenes)
* Compilable into JavaScript modules: no sources distributed, no parsing at runtime;
* No struggle with writing custom components or external plugins - it'll work out of the box with almost anything you can browserify;
* No need to learn complex framework-specific mechanisms. Just a couple of useful api functions and you are ready to go. You can stay with NodeJS and require(),
 implement your DI, IoC, or nothing at all);
* Small-footprint runtime library of essentials (the largest dependency is a promises library). Other useful features, like hash navigation/routing and REST resources
  are optional, they are shipped only if you require() them;
* Ready to merge into your gulp workflow off the shelf (no plugins needed);

More code and docs are coming.

Roadmap/Progress:
```
(x) - 2.0.0-wip branch
 |
 * - Initial project structure
 |
 * - XVDL compiler (basic instructions)
 |
 * - Core runtime library functions: commons, aggregator, html
 |
 * - Template module compiler (compiles .xml files into modules)
 |
 * - Static renderer (renders compiled modules into static .html pages, useful for
 |   generation of bootstrapping code, stylesheets, and other multi-page static content)
 |
 * - Gulp-friendly interface that boils all stuff into browser-ready apps
 |
 * - Runtime library essentials for dynamic context: oo, observable, api
 |
 * - Widget (it does all the glue between M, V and C to asynchronously run
 |    your compiled modules in browser)
 |
 * - Automatic widget bootstrapping from static context (never ever write bootstrapping
 |   code by hand!)
 |
 * - Widget spec: event processing echain,
 |
 * - Widget spec: observer 
 :
 * - Widget spec: error handling, incomplete object resolution
 :
 :
 * - Documentation and minimal samples (XVDL language, usage of runtime library,
 :    gulp-browserify recipes)
 :
( ) - 2.0.0 release
 .
 . - Utilities: css/dom helpers, hash navigation, observable data models for browser
 .   storage, generic REST, etc.
 .
 . - "Vendor" kit of generic UI components: layouts, forms, etc.
 .
 . - Tutorials/Sample apps (e.g.: todo list, google search, etc.)
 .
( ) - 2.1.0 release
 .
 . - Going hybrid-ready (touch events, cordova wrapping)
 .
 . - Optimizations and performance improvements (e.g., using web workers for smooth
 .	 rendering,  etc.)
 .
 . - Adaptation/packaging of some existing web/mobile UI libraries
 .
( ) - 2.2.0 release
 .
 . - Improvement of dev-tools: e2e, sourcemaps for XVDL, IDE plugins, etc.
 .
 . - Browser-side compiler port (for tutorial/demo use only)
 V
```

[npm-url]: https://www.npmjs.com/package/clearest
[npm-image]: https://badge.fury.io/js/clearest.svg
[travis-url]: https://travis-ci.org/m0nzderr/clearest
[travis-image]: https://img.shields.io/travis/m0nzderr/clearest/2.0.0-wip.svg
[coveralls-url]:  https://coveralls.io/github/m0nzderr/clearest
[coveralls-image]: https://img.shields.io/coveralls/m0nzderr/clearest/2.0.0-wip.svg
[depstat-url]: https://david-dm.org/m0nzderr/clearest/2.0.0-wip
[depstat-image]: https://david-dm.org/m0nzderr/clearest/2.0.0-wip.svg