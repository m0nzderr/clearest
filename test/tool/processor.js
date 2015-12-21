/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var chai = require("chai"),
    Processor = require("../../tool/processor.js"),
    aggregator = require("../../core/aggregator.js"),
    interpreter = require("eval"),
    Api = require("../../core/api"),
    dep1 = require("./fixtures/2/dependency");


describe('#processor', function () {

    describe('#compiled code', function () {

        it("should run", function () {
            var processor = new Processor();
            var moduleCode = processor.compile('<t:context/>');
            var template = interpreter(moduleCode);
            template(new Api(), aggregator, 42).should.be.exactly(42);
        });

        it("should resolve dependencies", function () {
            var processor = new Processor();
            var moduleCode = processor.compile('<t:fragment><t:require dep1="./fixtures/2/dependency"/><t:script>return dep1()</t:script></t:fragment>');
            var template = interpreter(moduleCode, {require: require});
            template(new Api(), aggregator, 0).should.be.exactly(dep1());
        });

        it("should handle environment variables as entities", function () {
            var processor = new Processor({environment:{
                foo:{bar:"42"}
            }});
            var moduleCode = processor.compile('<t:fragment>&env:foo.bar;</t:fragment>');
            var template = interpreter(moduleCode, {require: require});
            template(new Api(), aggregator, 0).should.be.exactly("42");
        });

        it("should handle recurrency", function () {
            var processor = new Processor({currentLocation:'./foo.xml' });
            var moduleCode = processor.compile('<t:if test="$context.count>0"><t:then><t:use template="./foo.xml" context="{count:$context.count-1,seed:$context.seed+14}"/></t:then><t:else><t:script>return $context.seed</t:script></t:else></t:if>');
            var template = interpreter(moduleCode, {require: function(){throw "Must not be called";}});
            template(new Api(), aggregator, {count:3, seed:0}).should.be.exactly(42);
        });
        //it("should handle circular dependencies", function () {});
    });
});

