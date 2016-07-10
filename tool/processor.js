/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Template compiler
 * @constructor
 */
"use strict"
var DOMParser = require('./domparser'),
    xvdl = require('./xvdl'),
    extend = require('extend'),
    codegen = require("./codegen"),
    path = require('path'),
    constants = require("./constants"),
    commons = require("../core/commons"),
    errors = require("./errors");

var isValue = commons.is.value;

var API = constants.API;
var ENTITY_PATH_SEPARATOR=".";

function Processor(userConfig) {

    var config = {
            // path to itself (as one would reference it from inside)
            currentLocation: null,
            dependencyMapper: null,
            // needed for only for static rendering, for SPA components that run in dynamic context could be turned off,
            // resulting in slightly better performance and code size reduction
            scopeCapture: true,
            xvdl: {
                resolver: {
                    template: requireTemplate,
                    dependency: requireModule,
                    inject: injectDependency
                }
            },
            /**
             * indicates to compiler that template references itself
             */
            isSelf: function (templateLocation) {
                var base = path.dirname(config.currentLocation || "./");
                return path.resolve(base, templateLocation) === path.resolve(config.currentLocation || "./");
            },
            rename: [/^(.*)\.xml$/,'$1.tpl.js'],
            module: {
                lazy: true, // lazy loading in order to allow circular dependencies
                preface: "/** This is automatically generated code. Any changes will be lost **/\n",
                component: "$comp$",
                require: "require",
                exportVar: "$template$",
            }
        },
        vars,
        body,
        injections,
        compIndex;

    function reset() {
        vars = [];
        injections= [];
        body = [];
        compIndex = 0;
    }


    function outputFilename(templateLocation) {
        return templateLocation.replace(config.rename[0], config.rename[1]);
    }

    this.outputFilename = outputFilename;

    function declareDependency(variableName, dependencyReference) {

        var requireCall = codegen.call({
                fn: config.module.require,
                args: dependencyReference
            });

        if (config.scopeCapture) {
            // add capture to require call
            requireCall = xvdlCompiler.apicall(API.depend,
		[config.module.exportVar, 
		 requireCall, 
	         dependencyReference]);
        }

        var assignment = variableName + " = " + requireCall;

        if (config.lazy) {
            // generates something like "foo = require("foo.xml.module.js")"
            vars.push(assignment);

        } else {
            // add conditional assignment at runtime "foo || foo= require("foo.xml.module.js"))"
            vars.push(variableName);
            body.push(variableName + " || ( " + assignment + " );");
        }
        return variableName;

    }

    function injectDependency(variableName,dependencyReference){
        injections.push(variableName + " = "+codegen.call({fn:constants.SYMBOL.api + constants.API.inject, args: dependencyReference}));
    }


    // called when template loads another template (component)
    function requireTemplate(location, importVariable) {

	var url = config.componentMapper? config.componentMapper(location): location;

        if (!importVariable) {
            if (config.isSelf(url)) {
                // return variable if it is a self reference
                return config.module.exportVar;
            }
            else {
                compIndex++;
                return declareDependency(config.module.component + compIndex, codegen.string(outputFilename(url)));
            }
        } else {
            // for t:import support
            return declareDependency(importVariable, codegen.string(outputFilename(url)));
        }
    }

    // called when template require()'s a dependency module
    function requireModule(variableName, url) {
        return declareDependency(variableName,
            codegen.string(
                config.dependencyMapper?
                    config.dependencyMapper(url): // map depencendy path relative to denstination path
                    url
            )
        );
    }

    var xvdlCompiler,
        domParser = new DOMParser(
            {
            errorHandler: function (error) {
                throw new errors.ParseError(error);
            }}
        );

    (this.configure = function (userConfig) {
        if (userConfig === undefined)
            return config;

        extend(true, config, userConfig);

        config.xvdl.scopeCapture = config.scopeCapture;
        config.xvdl.environment = config.environment;

        if (!xvdlCompiler) {
            xvdlCompiler = new (xvdl.Compiler)(config.xvdl);
            config.xvdl = xvdlCompiler.configure();
        } else {
            config.xvdl = xvdlCompiler.configure(config.xvdl);
        }
        return config;
    })(userConfig || {});


    function expandEntities(prefix, scope, ent){
        for(var k in scope){
            var v = scope[k];
            if (isValue(v)){
                ent[prefix + k]=v;
            } else {
                expandEntities(prefix + k + ENTITY_PATH_SEPARATOR, v, ent );
            }
        }
        return ent;
    }

    this.compile = function (templateString) {

        // expand environment variables into entity list before parsing
        domParser.options.entities = expandEntities("env:", xvdlCompiler.configure().environment, {});

        var doc = domParser.parseFromString(templateString);

        // clear state
        reset();

        // compile code
        var templateCode = xvdlCompiler.compile(doc);

        var exportClosure = codegen.closure({
            strict: true,
            args: codegen.list(xvdlCompiler.templateArguments()), // closure arguments
            vars: injections.length? injections.join("\n") : false,
            body: body.join("\n"), // closure body (lazy loading stuff)
            ret: templateCode // whole code sits in return statement
        });

        // add export variable
        vars.push(config.module.exportVar + " = " + exportClosure);

        // generate module code
        var moduleCode = config.module.preface
            + "var " + vars.join(",\n")
            + "\nmodule.exports = " + config.module.exportVar + ";";

        return moduleCode;
    }
}

module.exports = Processor;
