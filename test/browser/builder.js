/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var DomBuilder = require("../../browser/builder.js");

/**
 * Created by M0nZDeRR on 09/11/2015.
 */
if (typeof document !== 'undefined') { // simple trick to prevent this running by mocha from NodeJs
    describe("builder implementation", function () {

        var builder = new DomBuilder(document);

        it("should resolve elements by id", function () {
            expect(builder.getView("container").id).to.equal("container");
        });

        it("should render html presentation ", function () {
            var presentation = "hello world";
            var container = builder.getView("container");
            builder.render(container ,presentation);
            expect(container.innerHTML).to.equal(presentation);
        });

    });
}