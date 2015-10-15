/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var codegen = require("../codegen.js");


describe('#codegen', function () {
    it("should generate closures", function () {
        codegen.closure({args: "foo"})
            .should.be.exactly("function (foo) {\n}");

        codegen.closure({args: "foo", call: "bar"})
            .should.be.exactly("(function (foo) {\n})(bar)");

        codegen.closure({
            args: "foo",
            call: "bar",
            vars: "a,b,c",
            body: "c=c+b",
            ret: "a+b+c"
        })
            .should.be.exactly("(function (foo) {\nvar a,b,c;\nc=c+b\nreturn a+b+c\n})(bar)");
    });

    it("should generate objects", function () {
        codegen.object("foo", "bar")
            .should.be.exactly("{foo:bar}");

        codegen.object({foo: "bar"})
            .should.be.exactly('{foo:bar}');
    });

    it("should generate calls", function () {
        codegen.call({
            fn: "foo",
            args: "bar"
        })
            .should.be.exactly("foo(bar)");

        codegen.call({
            fn: "foo",
            args: "bar",
            context: "this"
        })
            .should.be.exactly("(foo).call(this,bar)");
    });

    it("should generate conditions", function () {
        codegen.iff({
            cond: "foo",
            then: "bar",
            "else": "qux"
        })
            .should.be.exactly("foo?bar:qux");

    });


});