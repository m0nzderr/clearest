/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Gulp-fiendly Clearest Tool
 *
 */
"use strict";
var through = require('through2');
var Processor = require('./processor');
var Renderer = require('./renderer');
var interpreter = require('eval');
var StringDecoder = require('string_decoder').StringDecoder;

//TODO: pick encoding from sources instead of hard-coded utf8
var decoder = new StringDecoder("utf8");

module.exports = {

    compiler: function (userConfig) {

        var config = extend(true, {
            processor: {
                // compiler settings
            },
            verbose: false,
            log: function (file) {
                console.log("compiling: " + file.relative);
            },
            error: function (file, error) {
                console.log("error compiling " + file.relative + ":" + error);
            }
        }, userConfig);


        var processor = new Processor(config.processor);

        // retrive complete configuration:
        config.processor = processor.configure();

        return through.obj(function (file, enc, cb) {

            function throwError(message) {
                throw new Error(message); //cb(new gutil.PluginError('clearest', message));
            }

            if (file.isNull()) {
                // return empty file
                return cb(null, file);
            }
            if (file.isStream()) {
                return throwError('Streaming is not supported');
            }
            if (file.isBuffer()) {
                if (config.verbose)
                    config.log(file);

                var originalPath = file.path;


                // rename output file (as compiler/processor would see it)
                file.path = config.processor.outputFile(file.path);

                try {
                    // compile and store contents
                    file.contents = new Buffer(processor.compile(decoder.write(file.contents)));
                } catch (error) {
                    //FIXME: how not to write to file at all?
                    // store error code
                    file.contents = new Buffer("/** compilation of " + originalPath + " failed **/\n throw " + codegen.string(error.message || error));
                    config.error(file);
                }
            }
            cb(null, file);
        });
    },

    /**
     * Compiles .xml templates into dynamic modules
     * @param userConfig
     */
    renderer: function (userConfig) {

        var config = extend({
            renderer: {},
            verbose: false,
            context: function (file) {
                return {
                    uri: outputHtml(file.relative),
                    name: pageName(file.relative)
                }
            },
            pageName: function (moduleUrl) {
                return moduleUrl.replace(/\.tpl\.js$/, '');
            },
            outputHtml: function (moduleUrl) {
                return config.pageName(moduleUrl) + '.html';
            },
            log: function (file) {
                console.log("rendering: " + file.relative);
            },
            error: function (file, error) {
                console.log("error rendering " + file.relative + ":" + error);
            }
        }, userConfig);

        var staticRenderer = new Renderer(config.renderer);

        return through.obj(function (file, enc, cb) {

            var streams = {}, pipe = this;

            function throwError(message) {
                throw new Error(message); //cb(new gutil.PluginError('clearest', message));
            }

            var ftrue = function () {
                return true
            }, ffalse = function () {
                return false
            };

            function appender(name, content) {
                if (!streams[name]) {

                    pipe.push(
                        // add file
                        streams[name] = new File({
                                cwd: file.cwd,
                                base: file.base,
                                path: config.pageName(file.path) + "." + name,
                                contents: new Buffer(content),
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
                        ));
                }
                else {
                    // append content
                    streams[name].contents = Buffer.concat(streams[name].contents, new Buffer(content));
                }
            }

            if (file.isNull()) {
                // return empty file
                return cb(null, file);
            }
            if (file.isStream()) {
                return throwError('Streaming is not supported');
            }
            if (file.isBuffer()) {
                if (config.verbose)
                    config.log(file);

                var originalPath = file.path;

                file.path = config.outputHtml(file.path);

                try {

                    // load module
                    // TODO: provide external means for caching
                    // TODO: maybe require(file.path) will be faster?
                    var module = interpreter(decoder.write(file.contents), {require: require});

                    // generate output
                    var output = staticRenderer.render(
                        config.context(file),
                        module,
                        appender);

                    // html output
                    file.contents = new Buffer(output);

                } catch (error) {
                    //FIXME: how not to write to file at all?
                    file.contents = new Buffer("Rendering of " + originalPath + " failed:" + (error.message || error));
                    config.error(file);
                    //TODO: remove data produced by appender
                }
            }
            cb(null, file);
        });
    }
};
