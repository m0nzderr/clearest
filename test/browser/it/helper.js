/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Created by M0nZDeRR on 17/12/2015.
 */

var runtime = require("../../../runtime");
var Widget = require("../../../browser/widget");
var Builder = require("../../../browser/app");
var $ = require("../../../browser/basic");

var xvdl = require("../../../tool/xvdl"),
    codegen = require("../../../tool/codegen"),
    Compiler = xvdl.Compiler;


function before(){
    var app = new Builder(document, $);
    var container = document.getElementById("container");

    function run(template) {

        if (app.root) {
            app.root.destroy();
        }

        var boot = function (P) {
            return P.start([{
                container: [P.wid(
                    template
                )]
            }]);
        };

        return runtime.promise.resolve(boot(new Widget(app)));
    }


    run.app = app;
    run.container = container;

    return run;
}

function after(run){
    if (run.app && run.app.root) {
        run.app.root.destroy();
    }
}

function getNamespaceDeclarations(compiler){
    var conf = compiler.configure();

    var decl=[];
    for(var ns in conf.namespace){
        decl.push("xmlns:"+conf.prefix[ns]+'="'+conf.namespace[ns]+'"');
    }
    return decl;

}


/**
 * Simplified in-browser compiler
 *
 * @param code
 * @returns {Object}
 */
function compile(code){

    var parser = new DOMParser();
    var compiler = new Compiler();
    var ns = getNamespaceDeclarations(compiler);
    var template =  parser.parseFromString("<t:fragment "+ns.join(" ")+">"+code+"</t:fragment>","application/xml");
    var exportClosure = codegen.closure({
        args: codegen.list(compiler.templateArguments()), // closure arguments
//        body: body.join("\n"), // closure body (lazy loading stuff)
        ret: compiler.compile(template)// whole code sits in return statement
    });
    return eval("template= "+exportClosure);
}

module.exports = {
    before:before,
    after:after,
    compile:compile
}