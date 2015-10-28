/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";
var
    dom = new (require("xmldom").DOMParser)(),
    chai = require("chai"),
    expect = chai.expect,
    xvdl = require("../../tool/xvdl"),
    Compiler = xvdl.Compiler;

describe('tool / xvdl instructions', function () {

    var compiler = new Compiler({
        symbol: {
            aggregator: "S",
            api: "P",
            empty: "0"
        }
    });

    it("static", function () {

        compiler.compile(dom.parseFromString('<foo/>'))
            .should.be.exactly('{foo:0}');

        compiler.compile(dom.parseFromString('<foo:bar/>'))
            .should.be.exactly('{"foo:bar":0}');

        compiler.compile(dom.parseFromString('<foo>bar<qux>dox</qux></foo>'))
            .should.be.exactly('{foo:S("bar",{qux:"dox"})}');

        // spaces are preserved in text-only elements
        compiler.compile(dom.parseFromString('<foo> bar1 <qux> dox </qux> bar2 </foo>'))
            .should.be.exactly('{foo:S("bar1",{qux:" dox "},"bar2")}');

        compiler.compile(dom.parseFromString('<foo bar="qux"/>'))
            .should.be.exactly('{foo:{"@bar":"qux"}}');

        compiler.compile(dom.parseFromString('<foo bar="qux">dox</foo>'))
            .should.be.exactly('{foo:S({"@bar":"qux"},"dox")}');


        /* deprecated notation:
         xvdl.transform(dom.parseFromString('<foo bar="qux" qux="dox">bar</foo>'))
         .should.be.exactly('{foo:{"@bar":"qux", "@qux":"dox", $:"bar"}}');
         */

        compiler.compile(dom.parseFromString('<foo bar=" qux " qux="dox"><bar/></foo>'))
            .should.be.exactly('{foo:S({"@bar":" qux ","@qux":"dox"},{bar:0})}');
    });

    it("t:fragment and t:comment", function () {

        var compiler = new Compiler({symbol: {empty: '0', aggregator: 'S'}});

        compiler.compile(dom.parseFromString('<t:fragment xmlns:t="http">bar</t:fragment>'))
            .should.be.exactly('"bar"');

        compiler.configure({environment: {build: {target: "web"}}});
        compiler.compile(dom.parseFromString('<t:fragment env:build.target="cordova">bar</t:fragment>'))
            .should.be.exactly('0');

        compiler.configure({environment: {build: {target: "cordova"}}});
        compiler.compile(dom.parseFromString('<t:fragment env:build.target="cordova">bar</t:fragment>'))
            .should.be.exactly('"bar"');

        compiler.configure({environment: {build: {target: "cordova"}}});
        compiler.compile(dom.parseFromString('<t:comment env:build.target="cordova">bar</t:comment>'))
            .should.be.exactly('{"!":"bar"}');



    });

    it("t:if", function () {

        compiler.compile(dom.parseFromString('<t:if test="mycondition">bar</t:if>'))
            .should.be.exactly('(mycondition)?"bar":0');

        compiler.compile(dom.parseFromString('<t:if test="mycondition"><t:then>foo</t:then><t:else>bar</t:else></t:if>'))
            .should.be.exactly('(mycondition)?"foo":"bar"');

        compiler.compile(dom.parseFromString('<t:if exist="a">bar</t:if>'))
            .should.be.exactly('S(P.get(function($1){return $1?"bar":0},P.cnt($context,["a"])))');

        compiler.compile(dom.parseFromString('<t:if exist="a,b,!c" from="d" test="f"><t:then>foo</t:then><t:else>bar</t:else></t:if>'))
            .should.be.exactly('S(P.get(function($1,$2,$3){return $1&&$2&&!$3&&(f)?"foo":"bar"},P.cnt(d,["a","b","c"])))');
    });

    it("t:control", function () {

        compiler.compile(dom.parseFromString('<t:control>bar</t:control>'))
            .should.be.exactly('S(function(){bar})');

        compiler.compile(dom.parseFromString('<foo e:click="boom"/>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",boom)})})');

        compiler.compile(dom.parseFromString('<foo e:click="boom">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",boom)},"bar")})');


        compiler.compile(dom.parseFromString('<foo e:click="boom(gas)">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",function($event){return boom(gas)})},"bar")})');

        compiler.compile(dom.parseFromString('<foo e:click="{return boom(gas2)}">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",function($event){return boom(gas2)})},"bar")})');

        // scope separation
        compiler.compile(dom.parseFromString('<t:control myvar="bar">return myvar</t:control>'))
            .should.be.exactly('S(P.ctl(function(myvar){return myvar},[bar]))');

    });


    it("t:use", function () {

        // implicit context
        compiler.compile(dom.parseFromString('<t:use template="foo"/>'))
            .should.be.exactly('S(P.use(foo,$context))');

        compiler.compile(dom.parseFromString('<t:use template="foo"/>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo,bar))');

        // explicit context + test aggregation call logic
        compiler.compile(dom.parseFromString('<t:use template="foo"><bar/></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo,{bar:0}))');
        compiler.compile(dom.parseFromString('<t:use template="foo"><bar/><t:fragment foo="123"/></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo,S({bar:0},{"@foo":"123"})))');
        compiler.compile(dom.parseFromString('<t:use template="foo"><bar/><baz/></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo,S({bar:0},{baz:0})))');

        compiler.compile(dom.parseFromString('<t:use template="foo"><t:control>code</t:control></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo,S(function(){code})))');

        compiler.compile(dom.parseFromString('<t:use template="foo" context="qux"></t:use>'), {$context: "bar"})
            .should.be.exactly('S(P.use(foo,qux))');

    });

    it("w:* (external)", function () {
        //TODO: @w:* (widget attributes)
        // implicit context
        //FIXME: implement scope separation
        compiler.compile(dom.parseFromString('<w:foo template="bar"/>'))
            .should.be.exactly('S({foo:S(P.wid(bar,$context))})');

        // explicit context
        compiler.compile(dom.parseFromString('<w:foo template="bar"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(bar,function(P,S){return {bar:0}}))})');
    });

    it("w:* (inline)", function () {
        //TODO: @w:* (widget attributes)
        // implicit context
        compiler.compile(dom.parseFromString('<w:foo><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(function(P,S,$context){return {bar:0}},$context))})');

        // implicit context should also switch
        compiler.compile(dom.parseFromString('<w:foo><bar/></w:foo>'),{$context:"foo"})
            .should.be.exactly('S({foo:S(P.wid(function(P,S,foo){return {bar:0}},foo))})');
    });

    it("t:context", function () {

        compiler.compile(dom.parseFromString('<t:context/>'))
            .should.be.exactly('$context');

        compiler.compile(dom.parseFromString('<t:context foo="bar"><t:context/></t:context>'))
            .should.be.exactly('S(P.get(function(foo){return foo},[bar]))');

        expect(function(){compiler.compile(dom.parseFromString('<t:context><t:context/></t:context>'))}).to.throw(Error);

        compiler.compile(dom.parseFromString('<t:context foo="bar" bar="mar"><t:context/></t:context>'))
            .should.be.exactly('S(P.get(function(foo,bar){return foo},[bar,mar]))');
    });

    it("t:get", function () {

        expect(function(){compiler.compile(dom.parseFromString('<t:get/>'))}).to.throw(Error);

        compiler.compile(dom.parseFromString('<t:get foo="bar"><foo>  <t:get foo="foo"/>  </foo></t:get>'))
            .should.be.exactly('S(P.get(function(foo){return {foo:foo}},[bar]))');

        compiler.compile(dom.parseFromString('<t:get foo="bar" bar="mar"> </t:get>'))
            .should.be.exactly('S(P.get(function(foo,bar){return " "},[bar,mar]))');
    });


    it("s:*", function () {
        //TODO: @where
        //TODO: @filter
        //TODO: @bind
        //TODO: @orderby

       compiler.compile(dom.parseFromString('<s:bar/>'))
            .should.be.exactly('S(P.sel($context,"bar"))');

        // @from
        compiler.compile(dom.parseFromString('<s:bar from="foo"><t:context/></s:bar>'))
            .should.be.exactly('S(P.sel(foo,"bar",function(bar,bar$index){return bar}))');

        // @from @as
        compiler.compile(dom.parseFromString('<s:bar from="foo" as="baz"><t:context/></s:bar>'))
            .should.be.exactly('S(P.sel(foo,"bar",function(baz,baz$index){return baz}))');
    });

    it("@e:*", function () {
        compiler.compile(dom.parseFromString('<foo e:click="boom"/>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",boom)})})');

        compiler.compile(dom.parseFromString('<foo e:click="boom">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",boom)},"bar")})');

        compiler.compile(dom.parseFromString('<foo e:click="controller.boom">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",controller.boom)},"bar")})');

        compiler.compile(dom.parseFromString('<foo e:click="boom(gas)">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",function($event){return boom(gas)})},"bar")})');

        compiler.compile(dom.parseFromString('<foo e:click="{return boom(gas2)}">bar</foo>'))
            .should.be.exactly('S({foo:S(function(){P.on(this,"click",function($event){return boom(gas2)})},"bar")})');

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