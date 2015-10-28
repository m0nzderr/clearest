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
var commons = require('../commons');
var Processor = require('./processor');
var Renderer = require('./renderer');
var codegen = require('./codegen');

//TODO: pick encoding from sources instead of hard-coded utf8
var promise = commons.promise;
var decoder = new StringDecoder("utf8");

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
            promise.resolve(processBuffer.call(this, file)).then(
                function (file) {
                    cb(null, file);
                },
                function (err) {
                    cb(err, null);
                });
        }
    });
}

module.exports = {

    compiler: function (userConfig) {

        /* istanbul ignore next */
        var config = extend(true, {
            processor: {
                // default compiler settings
            },
            verbose: true,
            log: function (file, msec) {
                gutil.log(gutil.colors.green("Compiling"), gutil.colors.cyan(file.relative), " in ", gutil.colors.magenta(msec), "ms");
            },
            error: function (file, error) {
                //gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
                throw new gutil.PluginError("clearest.compiler", error);
                //console.log("error compiling " + file.relative + ":", error);
                //FIXME: only print stack if error is runtime, for exceptions (like parsing error) show only error message
                //if (error.stack)
                //    console.log(stack);
            }
        }, userConfig);

        var processor = new Processor(config.processor);

        // retrive complete configuration:
        config.processor = processor.configure();

        return pipe(function (file) {
            var originalPath = file.path,
                start = new Date();

            processor.configure({currentLocation: originalPath}); // provide currentLocation
            file.path = processor.outputFilename(file.path);    // rename output file (as compiler/processor would see it)

            try {
                file.contents = new Buffer(processor.compile(decoder.write(file.contents)), 'utf8');  // compile and store contents
                if (config.verbose)
                    config.log(file, (new Date()) - start);
            } catch (error) {
                //FIXME: how not to write to file at all?
                file.contents = new Buffer("/** compilation of " + originalPath + " failed **/\n throw " + codegen.string(error.message), 'utf8');
                config.error(file, error);
            }

            return file;
        });
    },
    /**
     * Compiles .xml templates into dynamic modules
     * @param userConfig
     */
    renderer: function (userConfig) {


        /* istanbul ignore next */
        var config = extend(true, {
            renderer: {},
            verbose: true,
            useRequire: true,
            useInterpreter: true,
            boot: "clearest/browser/boot",
            bootstrap: ".bundle.js",
            output: ".html",
            filter: {}, // output filters
            rename: [/^(.*)\.tpl\.js/, '$1'],
            context: function (file) {
                return {
                    uri: basename(file.relative)
                }
            },
            log: function (file, msec) {
                gutil.log(gutil.colors.green("Rendering"), gutil.colors.cyan(file.relative), " in ", gutil.colors.magenta(msec), "ms");
            },
            error: function (file, error) {
                throw new gutil.PluginError("clearest.compiler", error, {showStack: true});
            }
        }, userConfig);

        function basename(moduleUrl) {
            return moduleUrl.replace(config.rename[0], config.rename[1]);
        }

        /*function outputHtml(moduleUrl) {
         return moduleUrl.replace(config.rename[0], config.rename[1]);
         }*/

        config.renderer.boot = config.boot;
        config.renderer.bootstrap = config.bootstrap;


        var staticRenderer = new Renderer(config.renderer);

        /* istanbul ignore next */
        var ftrue = function () {
            return true
        }, ffalse = function () {
            return false
        };


        return pipe(function (file) {

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
                    streams[name].contents = Buffer.concat(streams[name].contents, new Buffer(content, 'utf8'));
                }
            }

            function wrapFile(data) {
                if (data.path && data.relative) {
                    // looks like vinyl file, we can use it
                    return data;
                } else if (Buffer.isBuffer(data)) {
                    // got contents back as buffer, wrap it in file again
                    return makeFile(this, data);
                } else throw new TypeError("expected Buffer or File objects");
            }

            function push(file) {
                pipe.push(file);
            }


            function filterStream(file, filter) {
                var def = promise.defer();
                streamify([file]).pipe(filter).on('data', function (file) {
                    def.resolve(file);
                }).on('error', function (reason) {
                    def.reject(reason)
                });
                return def.promise
                    .then(wrapFile.bind(file));
            }

            function filterFunction(file, filter) {
                if (filter.length === 1) { // function(file) {... return file or promise;}
                    return promise.resolve(filter(file)).then(wrapFile.bind(file));
                }
                else if (filter.length === 2) {// function(file,cb) { .... cb(err,file)
                    //.nfcall(filter, file)
                    return (new Promise(function(resolve,reject){
                                filter(file,function(err,file){
                                    if (err) {
                                        reject(err);
                                    }
                                    else
                                        resolve(file);
                                })
                            })).then(wrapFile.bind(file));
                }
            }

            function getFilter(file, filter) {
                if (!filter)
                    return;

                if (isFunction(filter) || filter instanceof stream.Stream)
                    return filter;

                var appendix = file.appendix;
                return filter[appendix];
            }

            function applyFilter(file, filter) {

                if (isArray(filter)) {
                    var chain = false;
                    filter.forEach(function (item) {
                        if (!chain) {
                            chain = applyFilter(file, item);
                        }
                        else {
                            chain = chain.then(function (file) {
                                return applyFilter(file, item)
                            });
                        }
                    });
                    return chain;
                }

                if (isFunction(filter))
                    return filterFunction(file, filter);

                if (filter instanceof stream.Stream)
                    return filterStream(file, filter);

            }

            // writes/filters down appendices to stream
            function flush(file) {

                var jobs = [];

                // flush appendices/filters
                appendix.forEach(function (file) {
                    var filter = getFilter(file, config.filter);
                    var job = filter ? applyFilter(file, filter) : false;
                    if (job) {
                        jobs.push(job.then(push));
                    }
                    else {
                        push(file);
                    }
                });

                if (jobs.length == 0)
                // no jobs to wait
                    return file;
                else {
                    // wait for jobs to complete
                    var def = promise.defer();
                    promise.all(jobs).done(function () {
                        def.resolve(file);
                    });
                    return def.promise;
                }
            }

            var start = new Date();

            //file.path = outputHtml(file.path);
            // TODO: provide means for caching
            // TODO: maybe require(file.path) will be better?
            var templateModule;
            if (config.useRequire && fs.existsSync(file.path)) {
                // if file belongs to filesystem, use more efficient way: just require it dynamically
                templateModule = require(file.path);
            } else if (config.useInterpreter) {
                // try loading module from buffer contents and running an interpreter
                templateModule = interpreter(decoder.write(file.contents), file.path, {
                    require: function (module) {
                        //FIXME: deal with dependencies not in filesystem
                        //FIXME: the correct way is using path.resolve(), but it fails for standard modules, like require("path")
                        //return require(path.resolve(file.base, module));
                        //This one works, but its approach with replace "." is buggy!
                        return require(module.replace(/^\./, file.base));
                    }
                });
            } else throw Error("Unable to load compiled module for" + file.path);

            //TODO: check if error are treated here
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
