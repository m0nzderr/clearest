/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";
var runtime = require("../../../../runtime");
var helper = require("./../helper"), compile = helper.compile;


if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("IT: behavior / observer ", function () {
        var run, app;
        before(function () {
            run = helper.before();
            app = run.app;
        });
        after(function () {
            helper.after(run)
        });

        it("direct observe (@o:*.*)", function () {
            var code = compile('<t:context test="{answer:42}"><t:control>this.test=test;</t:control><w:input id="test-input1" o:test.answer="{this.value = $value}"/></t:context>');
            return run(code).then(function () {
                expect(app.find("test-input1").value).to.be.equal("42");
                runtime.send(run.container.test, {answer: 43});
                expect(app.find("test-input1").value).to.be.equal("43");
            });
        });


    });
}