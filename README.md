[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
# Clearest Framework

This is another front-end development framework for NodeJS.
Despite of being created recently on GitHub, the project already has a couple of years of mileage in highly complex projects.

Previous versions were closed-source and based on a combination of XSLT with other custom-built tools.
Since its version 2.0 it went open-source, being re-implemented from scratch to stay within NodeJS ecosystem.

Of course, there is a room to improve, and it would be wise to consider it "experimental" for some time until it gets more stable.
However, it might be worth a try for those who are looking for alternatives to AngularJS or ReactJS.

Here is why:
* It is designed for development of modular MVC/MVVM apps with minimal coding effort;
* It provides high-level, abstract, XML-based language for component development. Almost everything is done with a dozen of XML tags.
* 99% of code is browser-independent (no such thing as DOM manipulation, it could work without a browser at all)
* Sources are compiled before distribution: most of the job is done at compile time, no heavy processing or parsing at runtime;
* Open architecture: no struggle with writing custom components or external plugins - it is supposed to work with almost anything you can browserify;
* No restrictions on patterns or composition: put your logic anywhere you want (within XML "templates" or external JS files) and call it as you wish (view, model, controller or service);
* It only needs a tiny runtime library (<)to run a compiled app (the heaviest dependency is a RSVP promises);
* It is shipped as a gulp-ready tool which merges in almost any workflow;

[Documentation](doc/index.md) is on its way....

Roadmap/Progress:
```
(<wip>) - 2.0.0 first release estimated on Jan 1 2016
 |
( ) - Minimal complete documentation (getting started, usage of runtime library,
 :      gulp-browserify recipes, XVDL specification)
 .
 .    - Swiss knife libraries: css/dom helpers, hash navigation, models for browser storage and generic REST/ORM, etc.
 .
 .    - "Vendor" kit of generic UI components: layouts, forms, etc.
 .
 .    - Tutorials and sample apps (e.g.: todo list, search, etc.)
 .
( ) - 2.1.0
 .
 . - Window to parallel universes: t:compile and macro
 .
 . - Hybrid-ready (touch events, cordova)
 .
 . - Optimizations and performance improvements (e.g., using web workers behind the scenes for smoother
 .	 rendering?)
 .
 .
( ) - 2.2.0
 .
 . - Project web page, wiki
 .
 . - Improvement of dev-tools: e2e, sourcemaps for XVDL, IDE plugins, etc.
 .
 . - Browser-only toolkit for fiddling
 .

 V
```

[npm-url]: https://www.npmjs.com/package/clearest
[npm-image]: https://badge.fury.io/js/clearest.svg
[travis-url]: https://travis-ci.org/m0nzderr/clearest
[travis-image]: https://img.shields.io/travis/m0nzderr/clearest/master.svg
[coveralls-url]:  https://coveralls.io/github/m0nzderr/clearest
[coveralls-image]: https://img.shields.io/coveralls/m0nzderr/clearest/master.svg
[depstat-url]: https://david-dm.org/m0nzderr/clearest/master
[depstat-image]: https://david-dm.org/m0nzderr/clearest/master.svg
