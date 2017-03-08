[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]
# Clearest Framework

This is another experimental JS-based front-end engine for SPA building applications either for web or hybrid mobile environment.

### Core objectives
* _One engine, many friends._

  It should be able to talk with almost anything one could bootstrap alongside.
  No need to develop specific ports of existing UI-kits (but might just be useful), libraries, etc.

* _Good magic is the one you can total control of._

  There should be quite few core mechanisms for data binding and asynchronous flow control one have to get familiar with
  before start coding.

* _Dogmatic vs. Pragmaic - choose your own sweet spot._

  There may exist multiple ways to achieve the same result. One may bring his own patterns, discover new possibilities,
  be creative to find what works best.

* _Digest heavy meals while at home._

  It should do all the heavy lifting on build stages, providing only a thin layer for applications at runtime.


### Past, present and future
Despite of being created recently on GitHub, most of its concepts already have several years of mileage in highly
complex projects.

Its ancestors were developed as closed-source tools for fast prototyping web applications. The core idea was to use XML
model as a uniform abstraction for both content and view logic, so one could build an entire web application by only
writing some XML templates for presentation, thinking of any static or dynamic content as some kind of XML documents
(precisely speaking, trees of element and attribute nodes). These ideas gave rise to the so-called XVDL language.

Very first versions were PHP-based and, of course, ran XSLT transformations under the hood.
The next step was an attempt to bring all those server-side goodness into the browser, so one could build web client
apps for virtually any kind of back-end. In particular, being able to produce SPA REST client applications was just
enough, that's where the name Clearest came from.

Instead of interpreting XVDL templates in browsers (with or without XSLT), it was chosen to go straight into JavaScript
and compile any XVDL source early at the build stage. Produced JavaScript is then capable of generating all views
dynamically on the fly (somewhat similar to what ReactJS does, but without virtual DOM at all).

Today, Clearest 2.0 is a complete rewrite of past experience, implemented to stay within NodeJS ecosystem.
Is is still at alpha stage, so one should be aware of braking changes for some time.
searching for better solutions to address component encapsulation, reusability and testability.

### What is already done
Most of essential features, such as:
* A fully featured XVDL compiler (up to current spec);
* An asynchronous rendering engine (views can consume promises, etc.);
* A core component container named ``widget'' that controls rendering cycle;
* A Gulp-friendly build toolset for compilation and generation of production bundles;

### What should be done before 2.0-beta
* Transition to ES6
* Improve error handling
* Allow ``widgets'' to have custom rendering logic, so one could implement something like infinite scroll;
* Implement ``named template'' feature (somewhat similar to directives in Angular, but compilable at build stage)
* [Documentation](doc/index.md) is on its way....
* A ``swiss knife'' libraries for css/dom manipulation, navigation, ORM, and other useful patterns
  (optional, not as inseparable part of the framework)
* A repo of generic ``vendor'' UI templates
* Repo with boilerplate application templates and build recepies;
* Tutorials with a couple of sample apps.

### What's next
* Boost rendering with background workers;
* Develop some improved dev-tools (e2e testing, XVDL sourcemaps, maybe plugins for IDEs);
* Browser-only build environment for quick fiddling;
* Add meta-XVDL instructions, something like t:compile and t:macro, so one could think of creating highly reusable ecosystem;
  of components templates similar to LaTeX;
* Creating some UI kits for hybrid or native mobile app development (XVDL it not limited to HTML constructs).

[npm-url]: https://www.npmjs.com/package/clearest
[npm-image]: https://badge.fury.io/js/clearest.svg
[travis-url]: https://travis-ci.org/m0nzderr/clearest
[travis-image]: https://img.shields.io/travis/m0nzderr/clearest/master.svg
[coveralls-url]:  https://coveralls.io/github/m0nzderr/clearest
[coveralls-image]: https://img.shields.io/coveralls/m0nzderr/clearest/master.svg
[depstat-url]: https://david-dm.org/m0nzderr/clearest/master
[depstat-image]: https://david-dm.org/m0nzderr/clearest/master.svg

### Changelog
#### 22-alpha (07/03/2017)
Breaking changes:
 * t:select @property attribute renamed to @node
    and now is in string expression mode.

   Obsolete syntax:
   ```xml
        1: <t:select property="'foo'" ...>
        2: <t:select property="foo" ...>
        3: <t:select property="foo+bar" ...>
        4: <t:select property="'my'+{{foo}}" ...>
    ```
    New equivalent syntax:
   ```xml
        1: <t:select node="foo" ...>
        2: <t:select node="${foo}" ...>
        3: <t:select node="${foo+bar}" ...>
        4: <t:select node="my{{foo}}" ...>
    ```
Features:
 * t:observe instruction

   Usage:
   1. Explicit form of @o:*.*
   ```xml<t:observe node="foo" from="bar">doStuff(this,$value)</observe>```
   is equivalent to
   ```o:bar.foo="doStuff(this,$value)"```

   Context object is used when @from is omitted (same as in s:* and t:select)

   2. Explicit binding to widget renderer:
   ```xml<t:observe node="foo" from="bar"/>```
   produces equivalent behavior to
   ```<t:if exist="foo" from="bar"/>"```

   TODO: add integ. tests for widget behavior.

   3. @node property allows expressions, same as in t:select:
   ```xml<t:observe node="my{{foo}}and${bar+42}"```


Bugs:
* Fixed #29: <t:select ...> with body </select>

#### 21-alpha (22/09/2016)
* Added t:ignore instruction with build conditions support (e.g., @env:some.env.variable="value")
* Added t:import instruction and an optional attribute @from="<scope|source>" in t:use instruction,
   with the following use cases:
    ```xml
        <!-- at some point, variable refers to (compiled!) template code -->
        <t:import foo="path/to/foo.xml"/>
        ...
        <!-- at some other point, the template is invoked (rendered) from a variable, not a path -->
        <t:use template="foo" from="scope">...</t:use>
    ```
* Added an alternative @order="<function($item): number>" attribute for s:* instructions, to be used for providing
  ordering functions instead of expressions.
* Added compiler options property ```computeEnvironment: <function($environment)>``` to overrides
  environment variables on the fly for each compiled source. Use case:
  ```JavaScript
     computeEnvironment: ($env) => {
       $env.source.md5 = md5($env.source.rel);
      return $env;
    }
  ````

