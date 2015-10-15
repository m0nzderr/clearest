/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Template compiler
 * @constructor
 */
var dom = require('xmldom'),
    xvdl = require('./xvdl'),
    extend = require('extend'),
    codegen = require("./codegen");


function Processor(userConfig) {

    var config = {
            // path to itself (as one would reference it from inside)
            currentUrl: null,
            xvdl: {
                resolver: {
                    template: requireTemplate,
                    dependency: requireModule
                }
            },
            /**
             * indicates to compiler that template references itself
             */
            isSelf: function (templateUrl) {
                return config.currentUrl === templateUrl;
            },
            outputFile: function (templateUrl) {
                return templateUrl.replace(/^(.*)\.xml$/, '$1.tpl.js');
            },
            module: {
                lazy: true, // lazy loading in order to allow circular dependencies
                preface: "/** This is automatically generated code. Any changes may be lost **/\n",
                component: "$comp$",
                require: "require",
                exportVar: "$template$"
            }
        },
        vars,
        body,
        compIndex;

    function reset() {
        vars = [];
        body = [];
        compIndex = 0;
    }


    function declareDependency(variableName, dependencyReference) {

        var requireCall = codegen.call({
                fn: config.module.require,
                args: dependencyReference
            }),
            assignment = variableName + " = " + requireCall;

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

    function requireTemplate(url) {
        if (config.isSelf(url)) {
            // return variable if it is a self reference
            return module.exportVar;
        }
        else {
            compIndex++;
            return requireModule(config.module.component + compIndex, config.outputFile(url));
        }
    }

    function requireModule(variableName, url) {
        return declareDependency(variableName, codegen.string(url));
    }

    var xvdlCompiler,
        domParser = new (dom.DOMParser)({
            errorHandler: function (error) {
                throw new Error("parse error:" + error);
            }
        });

    (this.configure = function (userConfig) {
        if (userConfig === undefined)
            return config;

        extend(true, config, userConfig);

        if (!xvdlCompiler) {
            xvdlCompiler = new (xvdl.Compiler)(config.xvdl);
            config.xvdl = xvdlCompiler.configure();
        } else {
            config.xvdl = xvdlCompiler.configure(config.xvdl);
        }

        // setup template closure argument list
        config.module.arguments = [
            config.xvdl.scope.$context,
            config.xvdl.symbol.api,
            config.xvdl.symbol.aggregator,
            config.xvdl.symbol.empty
        ];
        return config;
    })(userConfig || {});

    this.compile = function (templateString) {

        var doc = domParser.parseFromString(templateString);

        // clear state
        reset();

        // compile code
        var templateCode = xvdlCompiler.compile(doc);

        var exportClosure = codegen.closure({
            args: codegen.list(config.module.arguments), // closure arguments
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
