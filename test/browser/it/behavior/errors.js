/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */


var runtime = require("../../../../runtime");
var helper = require("./../helper"), compile = helper.compile;


if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("IT: behavior / error handling", function () {
        var run, app;
        before(function () {
            run = helper.before();
            app = run.app;
        });
        after(function () {
            helper.after(run)
        });


        it("should handle resolution errors", function () {
            var code = compile(
                '<t:require rt="runtime">' +
                '<w:div id="test" ' +
                'w:set.error.event = "\'custom-error\'" ' +
                'w:set.error.capture="function(err, wid){ return (err.type === \'b\')? (wid.view.errorCaptured = err): false;}" ' +
                'e:custom-error = "this.errorFired = $event.detail;" >' +
                '<t:context ' +
                'test1="rt.promise.reject({type:\'a\'})" ' +
                'test2="rt.promise.reject({type:\'b\'})" ' +
                'test3="rt.promise.reject({type:\'c\'})"' +
                '>' +
                '' +
                '   <t:if-error type="a">' +
                '       <t:error as="foo">' +
                '        <t:control>' +
                '           this.errorCaught = foo;' +
                '        </t:control> ' +
                '       </t:error>  ' +
                '   </t:if-error>' +
                '</t:context>' +
                '</w:div>' +
                '</t:require>', {
                    runtime: runtime
                });
            return run(code).then(function () {
                expect(app.find("test").errorCaught).to.deep.equal({type: 'a'});
                expect(app.find("test").errorCaptured).to.deep.equal({type: 'b'});
                expect(app.find("test").errorFired).to.deep.equal({type: 'c'});
            });
        });


        it("should handle controller errors", function () {
            var code = compile(
                '<t:require rt="runtime">' +
                '<w:div id="test" ' +
                'w:set.error.event = "\'custom-error\'" ' +
                'e:custom-error = "this.errorFired = $event.detail;" >' +
                '<button id="button1" e:click="throw {error1:42};"/>' +
                '<button id="button2" e:click="= rt.promise.reject({error2:42})"/>' +
                '</w:div>' +
                '</t:require>', {
                    runtime: runtime
                });
            return run(code).then(function () {
                app.trigger(app.find("button1"),"click");
                return app.process();
            }).then(function(){
                expect(app.find("test").errorFired).to.have.property('error1');
            }).then(function () {
                app.trigger(app.find("button2"),"click");
                return app.process();
            }).then(function(){
                expect(app.find("test").errorFired).to.have.property('error2');
            })
        });

        it("should handle build errors", function () {
            var code = compile(
                '<t:require rt="runtime">' +
                '<w:div id="test" ' +
                'w:set.error.event = "\'custom-error\'" ' +
                'e:custom-error = "this.errorFired = $event.detail;" >' +
                '<t:control> return {build:function(){return rt.promise.reject({error1:42})}}</t:control>' +
                '</w:div>' +
                '</t:require>', {
                    runtime: runtime
                });
            return run(code).then(function(){
                expect(app.find("test").errorFired).to.have.property('error1');
            })
        });

    });
}