/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

var codegen = require("../../tool/codegen.js");


describe('#codegen', function () {
    it("should generate closures", function () {
        codegen.closure({args: "foo"})
            .should.be.exactly("function(foo){}");

        codegen.closure({args: "foo", call: "bar"})
            .should.be.exactly("(function(foo){})(bar)");

        codegen.closure({
            args: "foo",
            call: "bar",
            vars: "a,b,c",
            body: "c=c+b",
            ret: "a+b+c"
        }).should.be.exactly("(function(foo){var a,b,c;c=c+b;return a+b+c})(bar)");
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