/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var runtime = require("../../../runtime");
var helper = require("./helper"), compile=helper.compile;


if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("IT: minimal widget implementation", function () {

        var run ,  app;
        before(function(){ run= helper.before(); app = run.app; });
        after(function(){ helper.after(run)});

        it("hello world app", function () {
            return run(function (P, S, c) {
                return "Hello World"
            }).then(function () {
                expect(run.container.innerHTML).to.be.equal("Hello World");
            });

        });

        it("click 42 app", function () {
            return run(function (P, S, c) {
                return {
                    button: S({"@id": "button"}, "click-me", P.on("click", function () {
                        this.innerHTML = "42"
                    }))
                }
            }).then(function () {
                var button = app.find("button");
                expect(button.innerHTML).to.be.equal("click-me");
                app.trigger(button,"click");
                expect(button.innerHTML).to.be.equal("42");
            });
        });

        it("widget 42 app", function () {
            return run(
                function (P, S, c) {
                return P.get(function (scope) {
                    return {
                        button: S(P.wid(function (P, S, c) {
                            return S(P.sel(scope,"text"), P.on("click", function () {
                                runtime.send(scope, {text: "42"});
                            }));
                        }))
                    }
                },[{text:"click-me"}]);
            }).then(function () {
                var button = app.find("container-button1");
                expect(button.innerHTML).to.be.equal("click-me");
                app.trigger(button,"click");
                return app.process().then(function(){
                    expect(button.innerHTML).to.be.equal("42");
                });
            });
        });

    });
}