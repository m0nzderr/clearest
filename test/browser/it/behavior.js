/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */


var runtime = require("../../../runtime");
var helper = require("./helper"), compile = helper.compile;


if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("IT: behavior", function () {
        var run, app;
        before(function () {
            run = helper.before();
            app = run.app;
        });
        after(function () {
            helper.after(run)
        });

        it("js-expressions", function () {
            return run(compile('<t:get test="42"><input id="test-input1" value="${test}"/><input id="test-input2" value="the answer is ${test}"/></t:get>')).then(function () {
                expect(app.find("test-input1").value).to.be.equal("42");
                expect(app.find("test-input2").value).to.be.equal("the answer is 42");
            });
        });

        it("select-expressions", function () {
            return run(compile('<t:context test="{answer:42}"><input id="test-input1" value="{{answer}}"/><input id="test-input2" value="the answer is {{answer}}"/></t:context>')).then(function () {
                expect(app.find("test-input1").value).to.be.equal("42");
                expect(app.find("test-input2").value).to.be.equal("the answer is 42");
            });
        });

        it("select-expressions (live)", function () {
            var code = compile('<t:context test="{answer:42}"><t:control>this.test=test;</t:control><w:input id="test-input1" t:value="{{answer}}"/><w:input id="test-input2" t:value="the answer is {{answer}}"/></t:context>');
            return run(code).then(function () {
                expect(app.find("test-input1").value).to.be.equal("42");
                expect(app.find("test-input2").value).to.be.equal("the answer is 42");
                runtime.send(run.container.test, {answer: 43});
                return runtime.promise.resolve(app.process()).then(function () {
                    expect(app.find("test-input1").value).to.be.equal("43");
                    expect(app.find("test-input2").value).to.be.equal("the answer is 43");
                })
            });
        });

        it("direct observe (@o:*.*)", function () {
            var code = compile('<t:context test="{answer:42}"><t:control>this.test=test;</t:control><w:input id="test-input1" o:test.answer="{this.value = $event}"/></t:context>');
            return run(code).then(function () {
                expect(app.find("test-input1").value).to.be.equal("42");
                runtime.send(run.container.test, {answer: 43});
                expect(app.find("test-input1").value).to.be.equal("43");
            });
        });


    });
}