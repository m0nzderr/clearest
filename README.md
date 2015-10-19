Clearest Framework (WIP)

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
