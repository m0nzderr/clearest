[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
# Clearest Framework (WIP)

This is another front-end development framework for NodeJS.
Despite of being created recently, the project already had a couple of years of mileage in highly complex projects.

Its previous versions were closed-source and based on a combination of XSLT with other custom-built tools. Today it is being re-implemented to stay within NodeJS ecosystem. 

The WIP is going towards its first open-source release of v2.0.0. Hopefully, one may find in it an alternative to other MVC front-end frameworks like AngularJS and RecatJS.

Features:
* Designed for development of modular MVC/MVVM apps with minimal coding effort;
* Provides high-level, abstract, XML-based language for component development;
* Almost everything is done with a dozen of XML tags around your code;
* Compliable into reusable JavaScript modules (no parsing at runtime);
* No struggle with custom components or existing libs - it'll work with just anything you can require("...") and browsetify;
* Small-footprint runtime library of essentials (only depends on Q), other convinient features like hash navigation and REST resources are only used as require()'ed;
* Ready to merge into your gulp workflow out of the box;

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
 :
 . - Runtime library essentials for dynamic context: oo, observable
 :
 . - Widget implementation (it does all the glue between M, V and C to asynchronously run
 :    your compiled modules in browser)
 :
 . - Automatic widget bootstrapping from static context (never ever write bootstrapping
 :   code by hand)
 :
 . - Documentation and minimal samples (XVDL language, usage of runtime library,
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
 V
```

