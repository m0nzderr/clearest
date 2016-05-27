/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var App = require("../../../browser/app.js");
var wrapper = require("../../../browser/basic.js");


/**
 * BroserApp implementation tests
 */
if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("browser app (dom abstraction)", function () {

        var app = new App(document, wrapper );

        it("should resolve elements by id", function () {
            expect(app.find("container").id).to.equal("container");
        });

        it("should render html presentation ", function () {
            var presentation = "hello world";
            var container = app.find("container");
            app.render(container ,presentation);
            expect(container.innerHTML).to.equal(presentation);
        });

        it("should handle basic events", function () {

            var presentation = {button:{$id:"testButton", $:"test"}};
            var $ = app.wrapper;
            var container = app.find("container");
            app.render(container ,presentation);

            var button = app.find("testButton"), passWord =  "passed";
            var handler = function(event){ this.innerHTML = passWord; };
            app.on(button,"click",handler);
            app.trigger(button,"click");

            expect(button.innerHTML).to.equal(passWord);

            button.innerHTML = "off";

            app.off(button,"click",handler);

            // handler should not execute
            app.trigger(button,"click");
            expect(button.innerHTML).to.equal( "off");

        });


        it("should manage attributes", function () {

            var presentation = {$internal:"42"};
            var container = app.find("container");

            container.removeAttribute("internal");
            container.setAttribute("external",42);

            app.render(container ,presentation);

            expect(container.hasAttribute("internal")).to.be.ok;
            expect(container.getAttribute("internal")).to.be.equal("42");

            expect(container.hasAttribute("external")).to.be.ok;
            expect(container.getAttribute("external")).to.be.equal("42");

            presentation = {$internal2:"42"};

            app.render(container ,presentation);

            // remove old and add new
            expect(!container.hasAttribute("internal")).to.be.ok;
            expect(container.hasAttribute("internal2")).to.be.ok;
            expect(container.getAttribute("internal2")).to.be.equal("42");

            // keep external intact
            expect(container.hasAttribute("external")).to.be.ok;
            expect(container.getAttribute("external")).to.be.equal("42");

            container.removeAttribute("external");
            container.removeAttribute("internal2");
        });


        //TODO: should handle custom events


    });
}