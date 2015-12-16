/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var DomBuilder = require("../../browser/dom.js");
var wrapper = require("../../browser/basic.js");


/**
 * Created by M0nZDeRR on 09/11/2015.
 */
if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("browser dom layer implementation", function () {

        var builder = new DomBuilder(document, wrapper );

        it("should resolve elements by id", function () {
            expect(builder.find("container").id).to.equal("container");
        });

        it("should render html presentation ", function () {
            var presentation = "hello world";
            var container = builder.find("container");
            builder.render(container ,presentation);
            expect(container.innerHTML).to.equal(presentation);
        });

        it("should handle basic events", function () {

            var presentation = {button:{"@id":"testButton", $:"test"}};
            var container = builder.find("container");
            builder.render(container ,presentation);

            var button = builder.find("testButton"), passWord =  "passed";
            builder.wrap(button).on("click",function(){ this.innerHTML = passWord })
            builder.wrap(button).trigger("click");

            expect(button.innerHTML).to.equal(passWord);



        })

    });
}