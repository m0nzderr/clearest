/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var chai = require("chai"),
    Renderer = require("../renderer.js"),
    Processor = require("../processor.js"),
    fs = require("fs"),
    interpreter = require("eval");

var StringDecoder = require('string_decoder').StringDecoder;

//TODO: use encoding from providede sources
var decoder = new StringDecoder("utf8");


describe('#interpreter', function () {

    it('should be able to provide scope variables', function () {
        interpreter("module.exports = foo;", "foo.js", {foo: "bar"}).should.be.exactly("bar");
    });

    it('should be able to work with utf8 variables', function () {
        interpreter("module.exports = \u01A9;", "foo.js", {"\u01A9": "bar"}).should.be.exactly("bar");
    });

    it('should be able to call external functions', function () {
        function foo() {
            return "bar"
        }
        interpreter("module.exports = \u01A9();", "foo.js", {"\u01A9": foo}).should.be.exactly("bar");
    });
});


describe("#renderer", function () {

    var fixtures = [
        "./test/fixtures/1/index"
    ];

    fixtures.forEach(function (fixture) {

        it("test:" + fixture, function () {
            var processor = new Processor({xvdl: {code: {preserveSpaces: true}}});
            var renderer = new Renderer();

            var compiledModule = processor.compile(decoder.write(fs.readFileSync(fixture + ".xml")));
            var loadedModule = interpreter(compiledModule, {require: require});
            var outputHtml = decoder.write(fs.readFileSync(fixture + ".html"))
                                    .trim()
                                    .replace(/\s/g," ");

            renderer.render({name: fixture}, loadedModule)
                .trim()
                .replace(/\s/g," ")
                .should.be.exactly(outputHtml);
        });


    });


});




