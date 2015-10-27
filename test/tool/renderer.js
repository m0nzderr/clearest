/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var chai = require("chai"),
    expect = chai.expect,
    Renderer = require("../../tool/renderer.js"),
    Api = require("../../runtime/api.js"),
    Processor = require("../../tool/processor.js"),
    fs = require("fs"),
    interpreter = require("eval");

var StringDecoder = require('string_decoder').StringDecoder;

//TODO: use encoding from providede sources
var decoder = new StringDecoder("utf8");


describe('tool / interpreter', function () {

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


function onDemandCompileAndLoad(fixture, templatePath) {
    //console.log(templatePath,"compilation");
    var processor = new Processor({currentLocation: templatePath, xvdl: {code: {preserveSpaces: true}}});
    var compiledModule = processor.compile(decoder.write(fs.readFileSync(templatePath)));
    return interpreter(compiledModule, {
        require: function (path) {
            //console.log(templatePath,"required: "+path);
            var modulePath = path.replace(/^\./, fixture);
            //console.log(templatePath,"resolved: "+path);
            if (modulePath.match(/\.tpl\.js$/) && !fs.existsSync(modulePath)) {
                var recurrentTemplate = modulePath.replace(/\.tpl\.js$/, ".xml");
                //console.log(templatePath,"recurring: "+recurrentTemplate);
                return onDemandCompileAndLoad(fixture, recurrentTemplate);
            }
            else
                return require(modulePath);
        }
    });
}


describe("tool / static renderer", function () {


    describe("output generation", function () {

        var fixtures = [
            "./fixtures/1",
            "./fixtures/2",
            "./fixtures/3"
        ];

        fixtures.forEach(function (fixtureRelative) {

            var fixture = fixtureRelative.replace(/^\./, __dirname);

            it("should pass " + fixture, function () {
                var renderer = new Renderer();
                var loadedModule = onDemandCompileAndLoad(fixture, fixture + "/index.xml");
                var expectedHtml = decoder.write(fs.readFileSync(fixture + "/index.html"))
                    .trim()
                    .replace(/\s+/g, " ");

                var outputHtml = renderer.render(fixture + "/index.xml", loadedModule, {name: "index"})
                    .trim()
                    .replace(/\s+/g, " ");

                outputHtml.should.be.exactly(expectedHtml);
            });

        });
    });

    describe("dependency tracking", function () {

        var renderer = new Renderer();


        var root = {},
            a= {},
            b = {},
            a_from_root = {},
            a_from_b = {};

        inside(root).require={
            path:"./root.js"
        };

        it("should resolve relative locations",function(){
            var a_from_root = renderer.dep(root,{},"./a/a.js");

            inside(a_from_root ).require.path.should.be.equal("./a/a.js");

            var b_from_a = renderer.dep(a_from_root,{},"../b/b.js");

            inside(b_from_a ).require.path.should.be.equal("./b/b.js");
        });





    });

    describe("bootstrapping", function () {


        var renderer = new Renderer({
            boot: "boot"
        });
        var processor = new Processor();
        var bootCalled = false,
            ctlCalled = false, widgets={};

        var modules = {
            boot: {
                start: function () {
                    // boot implementation
                    var controllers = [];
                    bootCalled = true;
                    for (var i = 0, l = arguments.length; i < l; i++) {
                        var component = arguments[i];
                        for (var id in component) {
                            var init = component[id];
                            each(init, function (init) {
                                controllers.push(init.call(id));
                            });
                        }
                    }
                    return controllers;
                },
                ctl: Api.prototype.ctl,
                wid: function(template,context){
                    return function(){widgets[this]={template:template, context:context}}
                }
            },
            mylib: function () {
                // mock
                ctlCalled = true;
            },
            bar1:function(P,S,$context){
                return "bar1";
            },
            bar2:function(P,S,$context){
                return "bar2";
            },
        };

        var requireMock = function (module) {
            // console.log(module);
            return modules[module];
        };

        // compile template
        var compiled = processor.compile('<t:fragment>' +
            '   <t:require mylib="mylib"/>' +
            '   <foo><t:control fun="mylib">return fun();</t:control></foo>' +
            '   <w:bar template="bar1"/>' +
            '   <w:bar template="bar2"><foo>hello</foo></w:bar>' +
            '   <t:context foo="{bar:{}}">' +
            '       <w:bar><foo>hello</foo></w:bar>' +
            '   </t:context>' +
            '</t:fragment>');

        // load
        var template = interpreter(compiled, {require: requireMock});

        var bootCode;

        var context = {},
            hello= {foo:"hello"};

        // render
        renderer.render("foo/bar.js",template, context, function (file, content) {
            bootCode = content;
        });

        it("should bootstrap controllers", function () {
            // control is not called now
            expect(!ctlCalled).to.be.ok;
            // bootCode was generated
            expect(bootCode).to.be.ok;
            interpreter(bootCode, {require: requireMock});
            // control was called now (that will indicate that function depencency was correctly serialized)
            expect(ctlCalled).to.be.ok;
        });

        it("should bootstrap widgets external widgets with implicit context", function () {
            var w = widgets["bar1"];
            expect(w).to.be.ok;
            expect(w.context).deep.equal(context);// reference equality cannot hold after serialization :)
            expect(w.template).to.be.equal(modules.bar1);
        });

        it("should bootstrap widgets external widgets with explicit context", function () {
            var w = widgets["bar2"];
            expect(w).to.be.ok;
            expect(w.context()).deep.equal(hello);//
            expect(w.template).to.be.equal(modules.bar2);
        });

        it("should even bootstrap inline widgets", function () {
            var w = widgets["bar3"];
            expect(w).to.be.ok;
            expect(w.context).deep.equal({bar:{}});
            expect(w.template()).deep.equal(hello);
        });



    });


});






