/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Gulp-fiendly streaming interface
 */
"use strict";
var through = require('through2');
var Processor = require('./processor');
var Renderer = require('./renderer');
var interpreter = require('eval');
var extend = require('extend');
var File = require('vinyl');
var codegen = require('./codegen');
var path = require('path');
var fs =require('fs');
var StringDecoder = require('string_decoder').StringDecoder;

//TODO: pick encoding from sources instead of hard-coded utf8
var decoder = new StringDecoder("utf8");

function bufferPipe(onBuffer){
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
                onBuffer.call(this,file);
        }
        cb(null, file);
    });
}

module.exports = {

    compiler: function (userConfig) {

        /* istanbul ignore next */
        var config = extend(true, {
            processor: {
                // default compiler settings
            },
            verbose: false,
            log: function (file, msec) {
                console.log("compiling: " + file.relative + "(" + msec + "ms)");
            },
            error: function (file, error) {
                console.log("error compiling " + file.relative + ":", error);
                //FIXME: only print stack if error is runtime, for exceptions (like parsing error) show only error message
                //if (error.stack)
                //    console.log(stack);
            }
        }, userConfig);

        var processor = new Processor(config.processor);

        // retrive complete configuration:
        config.processor = processor.configure();

        return bufferPipe(function(file){
            var originalPath = file.path,
                start = new Date();

            processor.configure({currentLocation: originalPath}); // provide currentLocation
            file.path = config.processor.outputFile(file.path);    // rename output file (as compiler/processor would see it)

            try {
                file.contents = new Buffer(processor.compile(decoder.write(file.contents)), 'utf8');  // compile and store contents
                if (config.verbose)
                    config.log(file, (new Date()) - start);
            }catch(error){
                //FIXME: how not to write to file at all?
                file.contents = new Buffer("/** compilation of " + originalPath + " failed **/\n throw " + codegen.string(error.message), 'utf8');
                config.error(file, error);
            }
        });
    },
    /**
     * Compiles .xml templates into dynamic modules
     * @param userConfig
     */
    renderer: function (userConfig) {


        /* istanbul ignore next */
        var config = extend({
            renderer: {},
            verbose: false,
            useRequire: true,
            useInterpreter: true,
            context: function (file) {
                return {
                    uri: config.outputHtml(file.relative),
                    name: config.pageName(file.relative)
                }
            },
            boot: "clearest/browser/boot",
            pageName: function (moduleUrl) {
                return moduleUrl.replace(/\.tpl\.js$/, '');
            },
            outputHtml: function (moduleUrl) {
                return config.pageName(moduleUrl) + '.html';
            },
            log: function (file, msec) {
                console.log("rendering: " + file.relative + "(" + msec + "ms)");
            },
            error: function (file, error) {
                console.log("error rendering " + file.relative + ":", error);
                if (error.stack)
                    console.log(error.stack);
            }
        }, userConfig);


        config.renderer.boot = config.boot;

        var staticRenderer = new Renderer(config.renderer);

        /* istanbul ignore next */
        var ftrue = function () {
            return true
        }, ffalse = function () {
            return false
        };


        return bufferPipe(function (file) {

            var streams = {}, pipe = this;

            function append(name, content) {
                if (!streams[name]) {

                    pipe.push(
                        // add file
                        streams[name] = new File({
                                cwd: file.cwd,
                                base: file.base,
                                path: config.pageName(file.path) + "." + name,
                                contents: new Buffer(content, 'utf8'),
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
                    streams[name].contents = Buffer.concat(streams[name].contents, new Buffer(content, 'utf8'));
                }
            }

            var originalPath = file.path,
                    start = new Date();

                file.path = config.outputHtml(file.path);
                // TODO: provide means for caching
                // TODO: maybe require(file.path) will be better?
               var templateModule;
                if (config.useRequire && fs.existsSync(originalPath)) {
                    // if file belongs to filesystem, use more efficient way: just require it dynamically
                    templateModule = require(originalPath);
                } else if (config.useInterpreter) {
                    // try loading module from buffer contents and running an interpreter
                    templateModule = interpreter(decoder.write(file.contents), originalPath, {
                        require: function (module) {
                            //FIXME: deal with dependencies not in filesystem
                            //FIXME: the correct way is using path.resolve(), but it fails for standard modules, like require("path")
                            //return require(path.resolve(file.base, module));
                            //This one works, but its approach with replace "." is buggy!
                            return require(module.replace(/^\./, file.base));
                        }
                    });
                } else throw Error("Unable to load compiled module for" + originalPath);

            try {
                var output = staticRenderer.render(
                    /*
                    decoder.write(file.contents),
                    originalPath,*/
                    originalPath,
                    templateModule,
                    config.context(file),
                    append);

                if (config.verbose)
                    config.log(file, (new Date()) - start);

                // html output
                file.contents = new Buffer(output, 'utf8');
            }catch(error){
                //FIXME: how not to write to file at all?
                file.contents = new Buffer("Rendering of " + originalPath + " failed:" + (error.message), 'utf8');
                config.error(file, error);
                //TODO: files produced by appender
            }
        });
    }
};
