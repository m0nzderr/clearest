/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var chai = require("chai"),
    Processor = require("../processor.js"),
    aggregator = require("../runtime/aggregator.js"),
    interpreter = require("eval"),
    dep1 = require("./fixtures/2/dependency");


describe('#processor', function () {

    describe('#compiled code', function () {

        it("should run", function () {
            var processor = new Processor();
            var moduleCode = processor.compile('<t:context/>');
            var template = interpreter(moduleCode);
            template(42, {}, aggregator).should.be.exactly(42);
        });


        it("should resolve dependencies", function () {
            var processor = new Processor();
            var moduleCode = processor.compile('<t:fragment><t:require dep1="./fixtures/2/dependency"/><t:script>return dep1()</t:script></t:fragment>');
            var template = interpreter(moduleCode, {require: require});
            template(0, {}, aggregator).should.be.exactly(dep1());
        });

        //TODO:
        //it("should handle recurrency", function () {});
        //it("should handle circular dependencies", function () {});
    });
});

