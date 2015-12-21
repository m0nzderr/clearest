/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var runtime = require("../../../runtime");
var helper = require("./helper"), compile=helper.compile;


if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("IT: in-browser compilation (necessary for demos and other ITs)", function () {

        var run ,  app;
        before(function(){ run= helper.before(); app = run.app; });
        after(function(){ helper.after(run)});

        it("works", function () {
            return run(compile("Hello World")).then(function () {
                expect(run.container.innerHTML).to.be.equal("Hello World");
            });
        });

        it("dependencies are resolved", function () {
            return run(compile('<t:require rt="runtime"/><t:get text="rt.promise.resolve(\'Hello World\')"><t:get text="text"/></t:get>',{
                runtime: runtime
            })).then(function () {
                expect(run.container.innerHTML).to.be.equal("Hello World");
            });
        });

    });
}