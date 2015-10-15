/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
"use strict";
var
    dom = new (require("xmldom").DOMParser)(),
    chai = require("chai"),
    xvdl = require("../xvdl"),
    Compiler = xvdl.Compiler;

describe('#xvdl', function () {
    it("should produce static output", function () {

        var compiler = new Compiler({
            symbol: {
                aggregator: "S",
                empty: '0'
            }
        });

        compiler.compile(dom.parseFromString('<foo/>'))
            .should.be.exactly('S({foo:0})');

        compiler.compile(dom.parseFromString('<foo>bar<qux>dox</qux></foo>'))
            .should.be.exactly('S({foo:S("bar", {qux:"dox"})})');

        compiler.compile(dom.parseFromString('<foo> bar1 <qux>dox</qux> bar2 </foo>'))
            .should.be.exactly('S({foo:S(" bar1 ", {qux:"dox"}, " bar2 ")})');

        compiler.compile(dom.parseFromString('<foo bar="qux"/>'))
            .should.be.exactly('S({foo:{"@bar":"qux"}})');

        compiler.compile(dom.parseFromString('<foo bar="qux">dox</foo>'))
            .should.be.exactly('S({foo:S({"@bar":"qux"}, "dox")})');


        /* deprecated notation:
         xvdl.transform(dom.parseFromString('<foo bar="qux" qux="dox">bar</foo>'))
         .should.be.exactly('{foo:{"@bar":"qux", "@qux":"dox", $:"bar"}}');
         */

        compiler.compile(dom.parseFromString('<foo bar="qux" qux="dox"><bar/></foo>'))
            .should.be.exactly('S({foo:S({"@bar":"qux", "@qux":"dox"}, {bar:0})})');
    });

    it("should process t:fragment instruction", function () {

        var compiler = new Compiler({symbol: {empty: '0', aggregator: 'S'}});

        compiler.compile(dom.parseFromString('<t:fragment xmlns:t="http">bar</t:fragment>'))
            .should.be.exactly('S("bar")');

        compiler.configure({environment: {build: {target: "web"}}});
        compiler.compile(dom.parseFromString('<t:fragment env:build.target="cordova">bar</t:fragment>'))
            .should.be.exactly('0');

        compiler.configure({environment: {build: {target: "cordova"}}});
        compiler.compile(dom.parseFromString('<t:fragment env:build.target="cordova">bar</t:fragment>'))
            .should.be.exactly('S("bar")');

    });

    it("should process t:if instruction", function () {

        var compiler = new Compiler({
            symbol: {
                aggregator: "S",
                api: "P",
                empty: "0"
            }
        });

        compiler.compile(dom.parseFromString('<t:if test="mycondition">bar</t:if>'))
            .should.be.exactly('S((mycondition)?"bar":0)');

        compiler.compile(dom.parseFromString('<t:if test="mycondition"><t:then>foo</t:then><t:else>bar</t:else></t:if>'))
            .should.be.exactly('S((mycondition)?"foo":"bar")');

        compiler.compile(dom.parseFromString('<t:if exist="a,b,!c" from="d" test="f"><t:then>foo</t:then><t:else>bar</t:else></t:if>'))
            .should.be.exactly('S(P.get(function ($1, $2, $3) {\nreturn $1&&$2&&!$3&&(f)?"foo":"bar"\n}, P.cnt(d, ["a", "b", "c"])))');
    });

    it("should process t:control instructions and its related macro-expansions", function () {

        var compiler = new Compiler({
            symbol: {
                aggregator: "S",
                api: "P",
                empty: "0"
            }
        });

        compiler.compile(dom.parseFromString('<t:control>bar</t:control>'))
            .should.be.exactly('S(function ($node) {\nbar\n})');

        compiler.compile(dom.parseFromString('<foo e:click="boom"/>'))
            .should.be.exactly('S({foo:S(function ($node) {\nP.on(this, "click", boom)\n})})');

        compiler.compile(dom.parseFromString('<foo e:click="boom">bar</foo>'))
            .should.be.exactly('S({foo:S(function ($node) {\nP.on(this, "click", boom)\n}, "bar")})');


        compiler.compile(dom.parseFromString('<foo e:click="boom(gas)">bar</foo>'))
            .should.be.exactly('S({foo:S(function ($node) {\nP.on(this, "click", function ($event) {\nreturn boom(gas)\n})\n}, "bar")})');

        compiler.compile(dom.parseFromString('<foo e:click="{return boom(gas2)}">bar</foo>'))
            .should.be.exactly('S({foo:S(function ($node) {\nP.on(this, "click", function ($event) {\nreturn boom(gas2)\n})\n}, "bar")})');


    });

    it("should process t:use instruction", function () {

        var compiler = new Compiler({
            symbol: {
                aggregator: "S",
                api: "P",
                empty: "0"
            }
        });

        compiler.compile(dom.parseFromString('<t:use template="foo"/>'))
            .should.be.exactly('S(P.use(foo, $context))');

        compiler.compile(dom.parseFromString('<t:use template="foo"/>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo, bar))');

        compiler.compile(dom.parseFromString('<t:use template="foo"><bar/></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo, S({bar:0})))');

        compiler.compile(dom.parseFromString('<t:use template="foo" context="qux"></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo, qux))');

    });

    describe("compiler should generate errors", function () {

        var compiler = new Compiler();

        it("for unknown instruction", function () {
            // unknown instruction
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:foo>bar</t:foo>'))
            }).to.throw(Error);
        });

        it("for t:then without t:if", function () {

            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:then>bar</t:then>'));
                throw "foo";
            }).to.throw(Error);
        });

        it("for t:else without t:if", function () {
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:else>bar</t:else>'));
            }).to.throw(Error);
        });

        it("for repeated t:then ", function () {
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:if test="foo"><t:then>bar</t:then><t:then>foo</t:then></t:if>'))
            }).to.throw(Error);
        });

        it("for repeated t:else", function () {
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:if test="foo"><t:else>bar</t:else><t:else>foo</t:else></t:if>'))
            }).to.throw(Error);
        });


        it("for t:control with elements inside", function () {
            // t:control with elements inside
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:control><foo>bar</foo></t:control>'))
            }).to.throw(Error);
        });

        it("for t:use without @template", function () {
            // t:use without @template
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:use/>'))
            }).to.throw(Error);
        });

        it("for t:use with @context and body", function () {
            chai.expect(function () {
                compiler.compile(dom.parseFromString('<t:use template="1" context="2">3</t:use>'))
            }).to.throw(Error);
        });

    });

});