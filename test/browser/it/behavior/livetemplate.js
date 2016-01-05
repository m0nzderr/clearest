/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

var runtime = require("../../../../runtime");
var helper = require("./../helper"), compile = helper.compile;
var commons = require("../../../../core/commons");
var isValue = commons.is.value;

if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("IT: behavior / live template", function () {
        var run, app;
        before(function () {
            run = helper.before();
            app = run.app;
        });
        after(function () {
            helper.after(run)
        });

        it("should handle multiple rebuilds", function () {
            var code = compile(
                '<t:require rt="runtime">' +
                '<t:get state="{}">' +
                '<w:div id="test">' +
                '<t:if exist="test1" from="state">' +
                '<t:then><t:control>this.test1=state.test1</t:control></t:then>' +
                '<t:else><t:control>this.test1="nf";</t:control></t:else>' +
                '</t:if>' +
                '<t:control>this.state=state;</t:control>' +
                '</w:div>' +
                '</t:get>' +
                '</t:require>', {
                    runtime: runtime
                });
            return run(code).then(function () {
                    var state = app.find('test').state;
                    expect(state).to.be.ok;
                    runtime.send(state, 'test1', 42);
                    return app.process()
                })
                .then(function () {
                    expect(app.find('test').test1).to.be.equal(42);
                })
                .then(function () {
                    var state = app.find('test').state;
                    runtime.send(state, 'test1', 43);
                    return app.process()
                })
                .then(function () {
                    expect(app.find('test').test1).to.be.equal(43);
                })
                .then(function () {
                    var state = app.find('test').state;
                    runtime.send(state, 'test1', false);
                    return app.process()
                })
                .then(function () {
                    expect(app.find('test').test1).to.be.equal("nf");
                });
        });

        it("should handle multiple updates", function () {
            var code = compile(
                '<t:require rt="runtime">' +
                '<t:context state="{}">' +
                '<w:div id="test">' +
                '<t:context/>' +
                '<t:control>this.state=state;</t:control>' +
                '</w:div>' +
                '</t:context>' +
                '</t:require>', {
                    runtime: runtime
                });
            return run(code).then(function () {
                    var state = app.find('test').state;
                    expect(state).to.be.ok;
                    runtime.send(state, 'test1', 42);
                    return app.process()
                })
                .then(function () {
                    expect(app.find('test').innerHTML).to.be.equal('<test1>42</test1>');
                })
                .then(function () {
                    var state = app.find('test').state;
                    runtime.send(state, 'test1', 43);
                    return app.process()
                })
                .then(function () {
                    expect(app.find('test').innerHTML).to.be.equal('<test1>43</test1>');
                })
                .then(function () {
                    var state = app.find('test').state;
                    runtime.send(state, 'test1', null);
                    return app.process()
                })
                .then(function () {
                    var state = app.find('test').state;
                    expect(app.find('test').innerHTML).to.be.equal('');
                });
        });

    });
}