/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Gulp-fiendly streaming interface
 */
"use strict";
// node
var through = require('through2');
var path = require('path');
var fs = require('fs');
var stream = require('stream');
var StringDecoder = require('string_decoder').StringDecoder;
// libs
var interpreter = require('eval');
var extend = require('extend');
var File = require('vinyl');
var streamify = require('stream-array');
var gutil = require('gulp-util');

// project
var commons = require('../core/commons');
var Processor = require('./processor');
var Renderer = require('./renderer');
var codegen = require('./codegen');
var fixer = require("./fixer");

//TODO: pick encoding from sources instead of hard-coded utf8
var promise = commons.promise;
var decoder = new StringDecoder("utf8");

var isArray = commons.is.array;
var isFunction = commons.is.fun;

function pipe(processBuffer) {
    /* istanbul ignore next */
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            // return empty file
            return cb(null, file);
        }
        if (file.isStream()) {
            throw new Error('streaming is not supported');
        }
        if (file.isBuffer()) {
            try {
                promise.resolve(processBuffer.call(this, file)).then(
                    function (file) {
                        cb(null, file);
                    },
                    function (err) {
                        cb(err, null);
                    });
            }
            catch (err) {
                // in case of synchronous exception
                cb(err, null);
            }
        }
    });
}

/* istanbul ignore next */
function defaultLog(doingStuff) {
    return function (file, msec) {
        gutil.log(gutil.colors.green(doingStuff), gutil.colors.cyan(file.relative), " in ", gutil.colors.magenta(msec), "ms");
    }
}

/* istanbul ignore next */
function defaultTrace(doingStuff) {
    return function (file, args) {
        gutil.log.apply(this, [gutil.colors.yellow(doingStuff), gutil.colors.yellow(file.relative)].concat(commons.slice(arguments, 1)));
    }
}

/* istanbul ignore next */
function defaultError(who) {
    return function (file, error) {
        throw new gutil.PluginError(who, error);
    }
}

module.exports = {

    compiler: function (userConfig) {
        var config = extend(true, {
            environment: {
                //add process environment variables
                process: process.env
            },
            verbose: true,
            debug: false,
            /**
             * Switches scopeCapture mode on when detects sources used for static renering by its filename.
             */
            staticAutodetect: true,
            staticHint: /(^|\W)(html|static)($|\W)/i,
            /**
             * If source and target directories are different, must be provided
             * in order to correctly map dependencies for compiled code.
             */
            targetDir: null,
            sourceDir: null,
            log: defaultLog("Compiling"),
            trace: defaultTrace("[TRACE]"),
            error: defaultError("Clearet.Compiler")
        }, userConfig);

        // pass 'rename' option
        if (config.rename)
            config.processor.rename = config.rename;

        var processor = new Processor();//config.processor);

        // retrive complete configuration:
        config.processor = processor.configure();


        return pipe(function (file) {
            var originalPath = file.path, originalRelative = file.relative,
                start = new Date();

            // supposed to map relative dependencies from source dir to targetDir
            function mapFromSourceToTarget(location) {
                //TODO: deal with root dependencies ("/foo")
                if (!location.match(/^\./)) // not a relative path
                    return location;

                var referrerLocation = path.resolve(config.targetDir, fixer.fromPosix(originalRelative));
                var dependencyLocation = path.resolve(path.dirname(originalPath), fixer.fromPosix(location));

                var targetRelative = fixer.toPosix(path.relative(path.dirname(referrerLocation), dependencyLocation));
                if (config.debug) {
                    config.trace(file, 'relative dependency', location, 'mapped to', targetRelative)
                }
                return fixer.toPosix(targetRelative);
            }

            function mapFromSourceToSource(location) {
                if (!location.match(/^\//))
                    return location;

                var absoluteLocation = path.join(config.sourceDir, fixer.fromPosix(location));
                var sourceRelative = fixer.toPosix(path.relative(path.dirname(originalPath), absoluteLocation));
                if (config.debug) {
                    config.trace(file, 'component', location, 'mapped to', sourceRelative)
                }
                return fixer.toPosix(sourceRelative);
            }

            file.path = processor.outputFilename(file.path);    // rename output file (as compiler/processor would see it)

            var opts = {
                currentLocation: originalPath,
                // extend environment vaiables with path information
                environment: extend(true,
                    config.environment, {
                        source: {
                            file: path.basename(originalPath),
                            path: originalPath,
                            dir: path.dirname(originalPath)
                        },
                        target: {
                            file: path.basename(file.path),
                            path: file.path,
                            dir: config.targetDir
                        }
                    })
            };

            if (config.targetDir)
                opts.dependencyMapper = mapFromSourceToTarget;

            if (config.sourceDir)
                opts.componentMapper = mapFromSourceToSource;


            if (config.staticAutodetect) {
                opts.scopeCapture = !!(originalPath.match(config.staticHint));
            }

            processor.configure(opts); // provide currentLocation

            //try {
            file.contents = new Buffer(processor.compile(decoder.write(file.contents)), 'utf8');  // compile and store contents
            if (config.verbose)
                config.log(file, (new Date()) - start);

            return file;
        });
    },
    /**
     * Compiles .xml templates into dynamic modules
     * @param userConfig
     */
    renderer: function (userConfig) {
        var config = extend(true, {
            verbose: true,
            /**
             * renerer options (see. renderer.js)
             */
            renderer: {},
            /**
             * if compiled file exists on disk, will try to load it with require().
             * Turn it off by setting false, if it's a safety concern.
             */
            useRequire: true,
            /**
             * If useRequire == false or unsuccessful (no file on disk found),
             * it will use interpreter do execute loaded code from stream
             */
            useInterpreter: true, // will try to use interpreter instead

            /**
             * Require path to the bootstrapper implementation.
             * You could override it with your own code.
             */
            boot: "clearest/browser/boot",

            /**
             * Filename suffix for the generated bootstrap code output
             */
            bootstrap: ".bundle.js",
            /**
             * Filename suffix for the generated content output (html)
             */
            output: ".html",
            /**
             * Transform hooks for generated contents.
             *
             * It could be a function or a transform stream, or an object/array of those.
             * Example:
             *
             * transform:{
             *      ".bundle.js":[
             *          function(file,cb){
             *                  browserify(file, {basedir: path.dirname(file.path)}).bundle(cb)
             *          },
                        uglify()
             *          ]
             *      ".html": prettify()
             * }
             *
             * Functions are provideded with the corresponding buffered vinyl files (first argument),
             * and may return Vinyl Files, Buffers or promises of those. If the second argument is present,
             * a node-style callback(error,done) behavior is expected.
             *
             * Also, gulp-style transforms are supported.
             */
            transform: {}, // output filters
            /**
             * Determines the naming pattern for the output files.
             * It contains of two elemnents: [ regexp, replacePattern ]
             * Output filesnames are generated as input.replace(regexp,replacePattern)+suffixExtension.
             * The default setting strips ".tpl.js" part of the input filename before adding a suffix.
             */
            rename: [/^(.*)\.tpl\.js/, '$1'],

            /**
             * Generator function for a context object passed to the template
             * @param file vinyl file being processed
             */
            context: function (file) {
                return {
                    uri: basename(file.relative)
                }
            },
            /**
             * Logging function. Called if verbose = true.
             * log(file, timeMsec)
             */
            log: defaultLog("Rendering"),
            /**
             * Error function. By default throws a gulp.PluginError.
             * log(file, error)
             */
            error: defaultError("Clearet.Renderer") //TODO: check if show stack is necessary
        }, userConfig);

        function basename(moduleUrl) {
            return moduleUrl.replace(config.rename[0], config.rename[1]);
        }

        config.renderer.boot = config.boot;
        config.renderer.bootstrap = config.bootstrap;


        /* istanbul ignore next */
        var ftrue = function () {
            return true
        }, ffalse = function () {
            return false
        };


        return pipe(function (file) {


            var staticRenderer = new Renderer(config.renderer);

            var streams = {}, pipe = this, appendix = [];

            function makeFile(reference, buffer) {
                return new File({
                        cwd: reference.cwd,
                        base: reference.base,
                        path: reference.path,
                        contents: buffer,
                        stat: {
                            isFile: ftrue,
                            isDirectory: ffalse,
                            isBlockDevice: ffalse,
                            isCharacterDevice: ffalse,
                            isSymbolicLink: ffalse,
                            isFIFO: ffalse,
                            isSocket: ffalse
                        }
                    }
                );
            }

            // generates appendices
            function append(name, content) {
                if (!streams[name]) {
                    appendix.push(
                        // add file
                        streams[name] = makeFile({
                            cwd: file.cwd,
                            base: file.base,
                            path: basename(file.path) + name
                        }, new Buffer(content, 'utf8')));

                    streams[name].appendix = name;
                }
                else {
                    // append content
                    streams[name].contents = Buffer.concat([streams[name].contents, new Buffer(content, 'utf8')]);
                }
            }

            function wrapFile(data) {
                if (!data) return;
                if (data.path && data.relative) {
                    // looks like vinyl file, we can use it
                    return data;
                } else if (Buffer.isBuffer(data)) {
                    // got contents back as buffer, wrap it in file again
                    return makeFile(this, data);
                } else throw new TypeError("expected Buffer or File objects");
            }

            function push(file) {
                if (file)
                    pipe.push(file);
            }


            function transformStream(file, transform) {
                var def = promise.defer();
                streamify([file]).pipe(transform).on('data', function (file) {
                    def.resolve(file);
                }).on('error', function (reason) {
                    def.reject(reason)
                });
                return def.promise.then(wrapFile.bind(file));
            }

            function transformFunction(file, transform) {
                if (transform.length < 2) { // function(file) {... return file or promise;}
                    var res = transform(file);
                    if (res instanceof stream.Stream) {
                        return transformStream(file, res);
                    }
                    return promise.resolve(res)
                        .then(wrapFile.bind(file));
                }
                else if (transform.length === 2) {// function(file,cb) { .... cb(err,file)
                    var def = promise.defer();
                    transform(file, function (err, file) {
                        if (err) {
                            def.reject(err);
                        }
                        else {
                            def.resolve(file);
                        }
                    });
                    return def.promise.then(wrapFile.bind(file));
                }
            }

            function getTransform(file, transform) {
                if (!transform)
                    return;

                if (isArray(transform) || isFunction(transform) || transform instanceof stream.Stream)
                    return transform;

                var appendix = file.appendix;
                return transform[appendix];
            }

            function applyTransform(file, transform) {
                if (isArray(transform)) {
                    var chain = false;
                    transform.forEach(function (item) {
                        if (!chain) {
                            chain = applyTransform(file, item);
                        }
                        else {
                            chain = chain.then(function (file) {
                                return applyTransform(file, item)
                            });
                        }
                    });
                    return chain;
                }

                if (isFunction(transform))
                    return transformFunction(file, transform);

                if (transform instanceof stream.Stream)
                    return transformStream(file, transform);
            }

            // writes/filters down appendices to stream
            function flush(file) {
                var jobs = [];
                // apply transforms
                appendix.forEach(function (file) {
                    var transform = getTransform(file, config.transform);
                    var job = transform ? applyTransform(file, transform) : false;
                    if (job) {
                        jobs.push(job.then(push));
                    }
                    else {
                        push(file);
                    }
                });

                if (jobs.length == 0) {
                    //console.log('no jobs to wait');
                    // no jobs to wait
                    return file;
                }
                else {
                    // wait for jobs to complete
                    var def = promise.defer();
                    promise.all(jobs).then(function () {
                        def.resolve(file);
                    }, function (reason) {
                        throw reason;
                    });
                    /*,function (reason){
                     console.log('rejection:',reason, reason.stack);
                     def.reject(reason);
                     }*/
                    return def.promise;
                }
            }

            var start = new Date();

            var templateModule;
            if (config.useRequire && fs.existsSync(file.path)) {
                // if file belongs to filesystem, use more efficient way: just require it dynamically
                templateModule = require(file.path);
            } else if (config.useInterpreter) {
                // try loading module from buffer contents and running an interpreter
                templateModule = interpreter(decoder.write(file.contents), file.path, {
                    require: function (module) {
                        //FIXME: this is buggy
                        if (module.match(/^\.\./)) {
                            return require(module.replace(/^\.\./, file.base + "/.."))
                        }
                        return require(module.replace(/^\./, file.base));
                    }
                });
            } else throw Error("Unable to load compiled module for" + file.path);

            //TODO: check if errors are treated here
            var output = staticRenderer.render(
                file.path,
                templateModule,
                config.context(file),
                append);

            if (config.verbose)
                config.log(file, (new Date()) - start);
            // add rendered output
            append(config.output, new Buffer(output, 'utf8'));
            return flush(null);
        });
    }
};
