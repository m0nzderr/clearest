/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var chai = require("chai"),
    Renderer = require("../tool/renderer.js"),
    Processor = require("../tool/processor.js"),
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


function onDemandCompileAndLoad(fixture, templatePath){
    //console.log(templatePath,"compilation");
    var processor = new Processor({currentLocation: templatePath, xvdl: {code: {preserveSpaces: true}}});
    var compiledModule = processor.compile(decoder.write(fs.readFileSync(templatePath)));
    return interpreter(compiledModule, {require: function(path){
        //console.log(templatePath,"required: "+path);
        var modulePath = path.replace(/^\./,fixture);
        //console.log(templatePath,"resolved: "+path);
        if (modulePath.match(/\.tpl\.js$/) && !fs.existsSync(modulePath)){
            var recurrentTemplate = modulePath.replace(/\.tpl\.js$/,".xml");
            //console.log(templatePath,"recurring: "+recurrentTemplate);
            return onDemandCompileAndLoad(fixture, recurrentTemplate);
        }
        else
            return require(modulePath);
    }});
}


describe("#renderer", function () {


    var fixtures = [
        "./fixtures/1",
        "./fixtures/2",
        "./fixtures/3"
    ];

    fixtures.forEach(function (fixtureRelative) {

        var fixture = fixtureRelative.replace(/^\./, __dirname );

        it("test:" + fixture, function () {
            var renderer = new Renderer();
            var loadedModule = onDemandCompileAndLoad(fixture, fixture + "/index.xml");
            var expectedHtml = decoder.write(fs.readFileSync(fixture + "/index.html"))
                                    .trim()
                                    .replace(/\s+/g," ");

            var outputHtml =renderer.render({name: "index"}, loadedModule)
                .trim()
                .replace(/\s+/g," ");

            outputHtml.should.be.exactly(expectedHtml);
        });

    });


});




