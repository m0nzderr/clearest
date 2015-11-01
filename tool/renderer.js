/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Static renderer
 * @constructor
 */
"use strict"
var commons = require("../commons"),
    codegen = require("./codegen"),
    promise = commons.promise,
    html = require("./../runtime/html.js"),
    Api = require("./../runtime/api.js"),
    path = require("path"),
    extend = require("extend"),
    inside = commons.inside,
    constants = require("./constants"),
    Serializer = require("./serializer"),
    fixer = require("./fixer");


var API = constants.API,
    SYMBOL = constants.SYMBOL;


function apicall(api, args) {
    return codegen.call({
        fn: SYMBOL.api + api,
        args: codegen.list(args)
    });
}


commons.inherit(Renderer, Api)
function Renderer(userConfig) {
    // configuration
    var config = {
        doctype: '<!DOCTYPE html>\n',
        boot: 'clearest/browser/boot',
        bootstrap: ".bundle.js" // suffix for the bootrstrap bundle code output
    };
    (this.configure = function (userConfig) {
        if (userConfig === undefined)
            return config;
        extend(true, config, userConfig);
        return config;
    })(userConfig || {});

    // call constructor
    Renderer.super(this);
    var components = this.components;


    /*this.use=function(template,context){
     // normal use
     return Renderer.super().use(template,context);
     }*/


    this.render = function (templatePath, templateModule, context, append) {
        /*var runtimeScope = {}; */
        // var templateModule = load(moduleCode, moduleFile);

        var serializer = new Serializer();

        inside(templateModule).require = {
            path: templatePath
        };

        var presentation = templateModule(this, this.agg, context);

        // static widget has no its-own id prefix
        this._setId(false);
        // populate components, generate their ids
        this._scan(presentation);

        var initializers = [];

        // prepare data for serialization
        components.forEach(function (component) {
            var items = [];
            // serialize control functions
            each(component.init, function (ctl) {
                items.push(
                    serializer.serialize(ctl)
                );
            });

            initializers.push(codegen.object(
                component.id,
                codegen.array(items)
            ));
        });

        if (initializers.length) {
            // generate IIFE
            var boot = codegen.closure({
                args: constants.SYMBOL.api,
                vars: codegen.list(serializer.vars),
                ret: apicall(
                    API.start,
                    [codegen.array(initializers)]
                ),
                call: codegen.call({
                    fn: "require",
                    args: codegen.string(config.boot)
                })
            });
            // store bootrstap code
            append(config.bootstrap, boot);
        }
        //TODO: deal with promises
        return config.doctype + html(presentation);
    }

    /*var sepFixerRe = new RegExp('\\' + path.sep, 'g'),
        sepNormalizerRe = /\//g;*/

    // store dependency information
    this.dep = function (dependent, dependency, source) {
        if (source.match(/^\./)) {
            var rq = inside(dependent).require;
            var root = rq.root || (path.dirname(path.resolve(fixer.fromPosix(rq.path))) ); //.replace(sepNormalizerRe, path.sep)
            var base = rq.abs ? path.dirname(rq.abs) : root;
            var abs = path.resolve(base, fixer.fromPosix(source)); // .replace(sepNormalizerRe, path.sep)
            var rel = "./" + fixer.toPosix(path.relative(root, abs));//.replace(sepFixerRe, "/");
            //console.log("resolved: ", source, "to", rel, "as", abs, " @ ",base);
            //relative
            inside(dependency).require = {
                root: root,
                abs: abs,
                path: rel
            };
        }
        else {
            //global
            inside(dependency).require = {
                path: source
            };
        }

        inside(dependency).serialize = function (ser) {
            return ser.require(inside(dependency).require.path)
        };
        return dependency;
    }
}


// wraps scope inside control function
Renderer.prototype.ctl = function (ctl, scope) {

    inside(ctl).serialize = function (ser) {
        return apicall(API.control, [ctl.toString(), codegen.array(ser.serialize(scope))]);
    };
    return ctl;
};

// wraps arguments of function into a call to itself
Renderer.prototype.wid = function (template, context) {
    var scope = [template];
    if (context) {
        scope.push(context);
    }
    /* istanbul ignore next */
    var stub = function () {
    };
    inside(stub).serialize = function (ser) {
        return apicall(API.widget, ser.serialize(scope));
    };

    return stub;
};

module.exports = Renderer;