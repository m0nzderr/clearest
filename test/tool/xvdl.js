/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";
var
    dom = new (require("../../tool/domparser"))(),
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

    it("static output", function () {

        compiler.compile(dom.parseFromString('<foo/>'))
            .should.be.exactly('{foo:0}');

        //TODO 2.1.0: test for ellipsis
        /*
        compiler.compile(dom.parseFromString('<x:.../>'))
            .should.be.exactly('{"x:...":0}');
        */

        compiler.compile(dom.parseFromString('<foo:bar/>'))
            .should.be.exactly('{"foo:bar":0}');

        compiler.compile(dom.parseFromString('<foo>bar<qux>dox</qux></foo>'))
            .should.be.exactly('{foo:S("bar",{qux:"dox"})}');

        // spaces are preserved in text-only elements
        compiler.compile(dom.parseFromString('<foo> bar1 <qux> dox </qux> bar2 </foo>'))
            .should.be.exactly('{foo:S("bar1",{qux:" dox "},"bar2")}');

        compiler.compile(dom.parseFromString('<foo bar="qux"/>'))
            .should.be.exactly('{foo:{"@bar":"qux"}}');

        // issue #19
        compiler.compile(dom.parseFromString('<foo bar=""/>'))
            .should.be.exactly('{foo:{"@bar":""}}');


        compiler.compile(dom.parseFromString('<foo bar="qux">dox</foo>'))
            .should.be.exactly('{foo:S({"@bar":"qux"},"dox")}');


        /* deprecated notation:
         xvdl.transform(dom.parseFromString('<foo bar="qux" qux="dox">bar</foo>'))
         .should.be.exactly('{foo:{"@bar":"qux", "@qux":"dox", $:"bar"}}');
         */

        compiler.compile(dom.parseFromString('<foo bar=" qux " qux="dox"><bar/></foo>'))
            .should.be.exactly('{foo:S({"@bar":" qux ","@qux":"dox"},{bar:0})}');
    });

    it("t:fragment, t:comment and t:require", function () {

        var compiler = new Compiler({symbol: {empty: '0', aggregator: 'S'}});

        compiler.compile(dom.parseFromString('<t:fragment xmlns:t="http">bar</t:fragment>'))
            .should.be.exactly('"bar"');

        // @dep should not leak into the code
        compiler.compile(dom.parseFromString('<t:require dep="mydep">bar</t:require>'))
            .should.be.exactly('"bar"');

        compiler.configure({environment: {build: {target: "web"}}});
        compiler.compile(dom.parseFromString('<t:fragment env:build.target="cordova">bar</t:fragment>'))
            .should.be.exactly('0');

        compiler.configure({environment: {build: {target: "cordova"}}});
        compiler.compile(dom.parseFromString('<t:fragment env:build.target="cordova">bar</t:fragment>'))
            .should.be.exactly('"bar"');

        compiler.compile(dom.parseFromString('<t:comment env:build.target="cordova">bar</t:comment>'))
            .should.be.exactly('{"!":"bar"}');

        // @dep should not leak into the code
        compiler.compile(dom.parseFromString('<t:require dep="mydep">bar</t:require>'))
            .should.be.exactly('"bar"');


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

    it("t:if-error", function () {

        compiler.compile(dom.parseFromString('<t:if-error>bar</t:if-error>'))
            .should.be.exactly('P.err($context)?"bar":0');

        compiler.compile(dom.parseFromString('<t:if-error type="foo" test="$error.code===404" from="bar">bar</t:if-error>'))
            .should.be.exactly('P.err(bar,0,"foo",function($error){return $error.code===404})?"bar":0');

    });

    it("t:error", function () {

        // catches by default
        compiler.compile(dom.parseFromString('<t:error/>'))
            .should.be.exactly('P.err($context,1)');
        compiler.compile(dom.parseFromString('<t:error from="foo"/>'))
            .should.be.exactly('P.err(foo,1)');

        // will olny test type
        compiler.compile(dom.parseFromString('<t:error type="bar"/>'))
            .should.be.exactly('P.err($context,0,"bar")');

        compiler.compile(dom.parseFromString('<t:error from="foo" type="bar"/>'))
            .should.be.exactly('P.err(foo,0,"bar")');

        // will catch specific type
        compiler.compile(dom.parseFromString('<t:error catch="bar"/>'))
            .should.be.exactly('P.err($context,1,"bar")');


        compiler.compile(dom.parseFromString('<t:error><t:context/></t:error>'))
            .should.be.exactly('P.err($context,1,function($error){return $error})');

        compiler.compile(dom.parseFromString('<t:error type="*"><t:context/></t:error>'))
            .should.be.exactly('P.err($context,0,function($error){return $error})');

        compiler.compile(dom.parseFromString('<t:error catch="*"><t:context/></t:error>'))
            .should.be.exactly('P.err($context,1,function($error){return $error})');

        compiler.compile(dom.parseFromString('<t:error catch="bar"><t:context/></t:error>'))
            .should.be.exactly('P.err($context,1,"bar",function($error){return $error})')

        compiler.compile(dom.parseFromString('<t:error catch="bar" as="foo"><t:context/></t:error>'))
            .should.be.exactly('P.err($context,1,"bar",function(foo){return foo})');
    });


    it("t:control", function () {

        compiler.compile(dom.parseFromString('<t:control>bar</t:control>'))
            .should.be.exactly('S(function(){bar})');

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

        // implicit context
        //FIXME: implement scope separation
        compiler.compile(dom.parseFromString('<w:foo w:template="bar"/>'))
            .should.be.exactly('S({foo:S(P.wid(bar,$context))})');

        // explicit context
        compiler.compile(dom.parseFromString('<w:foo w:template="bar"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(bar,function(P,S){return {bar:0}}))})');

        // attributes
        compiler.compile(dom.parseFromString('<w:foo bar1="bar1" t:bar2="bar2" w:template="bar"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S({"@bar1":"bar1"},P.wid(bar,function(P,S){return S({"@bar2":"bar2"},{bar:0})}))})');

        // controllers
        compiler.compile(dom.parseFromString('<w:foo bar1="bar1" o:foo.bar="qux" w:template="bar"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S({"@bar1":"bar1"},P.wid(bar,function(P,S){return S(P.obs(foo,"bar",qux),{bar:0})}))})');

        // error
        expect(function () {
            compiler.compile(dom.parseFromString('<w:foo bar1="bar1" t:bar2="bar2"  w:template="bar"/>'))
        }).to.throw(Error);
        expect(function () {
            compiler.compile(dom.parseFromString('<w:foo bar1="bar1" p:foo.bar="qux"  w:template="bar"/>'))
        }).to.throw(Error);

    });

    it("w:* (inline)", function () {
        // implicit context
        compiler.compile(dom.parseFromString('<w:foo><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(function(P,S,$context){return {bar:0}},$context))})');

        // stub
        compiler.compile(dom.parseFromString('<w:foo w:stub="stub"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.use(stub,$context),P.wid(function(P,S,$context){return {bar:0}},$context))})');


        // implicit context should switch
        compiler.compile(dom.parseFromString('<w:foo><bar/></w:foo>'), {$context: "foo"})
            .should.be.exactly('S({foo:S(P.wid(function(P,S,foo){return {bar:0}},foo))})');

        // attributes
        compiler.compile(dom.parseFromString('<w:foo bar1="bar1" t:bar2="bar2"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S({"@bar1":"bar1"},P.wid(function(P,S,$context){return S({"@bar2":"bar2"},{bar:0})},$context))})');

        compiler.compile(dom.parseFromString('<w:foo o:foo.bar="qux"/>'))
            .should.be.exactly('S({foo:S(P.wid(function(P,S,$context){return S(P.obs(foo,"bar",qux))},$context))})');


    });

    it("@w:set.* (parameters)", function () {

        compiler.compile(dom.parseFromString('<w:foo w:set.bar="42"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(function(P,S,$context){return {bar:0}},$context,{bar:42}))})');

        compiler.compile(dom.parseFromString('<w:foo w:set.bar="42"  w:set.foo="43"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(function(P,S,$context){return {bar:0}},$context,{bar:42,foo:43}))})');

        compiler.compile(dom.parseFromString('<w:foo w:set.bar="{foo:42}"  w:set.foo="43"><bar/></w:foo>'))
            .should.be.exactly('S({foo:S(P.wid(function(P,S,$context){return {bar:0}},$context,{bar:{foo:42},foo:43}))})');

        expect(function () {
            compiler.compile(dom.parseFromString('<w:foo w:set.bar="{foo:42}"  w:set.bar.qux="43"><bar/></w:foo>'))
        }).to.throw(Error);
    });

    it("t:context", function () {

        compiler.compile(dom.parseFromString('<t:context/>'))
            .should.be.exactly('$context');

        compiler.compile(dom.parseFromString('<t:context foo="bar"><t:context/></t:context>'))
            .should.be.exactly('S(P.get(function(foo){return foo},[bar]))');

        expect(function () {
            compiler.compile(dom.parseFromString('<t:context><t:context/></t:context>'))
        }).to.throw(Error);

        compiler.compile(dom.parseFromString('<t:context foo="bar" bar="mar"><t:context/></t:context>'))
            .should.be.exactly('S(P.get(function(foo,bar){return foo},[bar,mar]))');
    });

    it("t:get", function () {

        expect(function () {
            compiler.compile(dom.parseFromString('<t:get/>'))
        }).to.throw(Error);

        compiler.compile(dom.parseFromString('<t:get foo="bar"><foo>  <t:get foo="foo"/>  </foo></t:get>'))
            .should.be.exactly('S(P.get(function(foo){return {foo:foo}},[bar]))');

        compiler.compile(dom.parseFromString('<t:get foo="bar" bar="mar"> </t:get>'))
            .should.be.exactly('S(P.get(function(foo,bar){return " "},[bar,mar]))');

        // template extressions

        // single select from another object
        compiler.compile(dom.parseFromString('<t:get bar="{{foo.bar}}"/>'))
            .should.be.exactly('S(P.sel(foo,"bar"))');

        // code expression
        compiler.compile(dom.parseFromString('<t:get bar="f({{foo.bar}})"/>'))
            .should.be.exactly('S(P.get(function($1){return f($1)},[P.sel(foo,"bar")]))');

        // second order get
        compiler.compile(dom.parseFromString('<t:get bar="f({{foo.bar}})"><bar><t:get bar="bar"/></bar></t:get>'))
            .should.be.exactly('S(P.get(function(bar){return {bar:bar}},[P.get(function($1){return f($1)},[P.sel(foo,"bar")])]))');

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

    it("@e:* (handler code generation)", function () {

        // return bar
        compiler.compile(dom.parseFromString('<foo e:click="=bar"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function(){return bar}))})');

        // handle bar
        compiler.compile(dom.parseFromString('<foo e:click=":bar"/>'))
            .should.be.exactly('S({foo:S(P.on("click",bar))})');

        // guess as code
        compiler.compile(dom.parseFromString('<foo e:click="{bar}"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function(){bar}))})');
        compiler.compile(dom.parseFromString('<foo e:click="bar;"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function(){bar}))})');

        compiler.compile(dom.parseFromString('<foo e:click="foo=bar"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function(){foo=bar}))})');

        // guess as call
        compiler.compile(dom.parseFromString('<foo e:click="bar()"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function(){return bar()}))})');

        // guess handler
        compiler.compile(dom.parseFromString('<foo e:click="bar"/>'))
            .should.be.exactly('S({foo:S(P.on("click",bar))})');

        // closure arguments
        compiler.compile(dom.parseFromString('<foo e:click="=$event"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function($event){return $event}))})');

        // closure arguments
        compiler.compile(dom.parseFromString('<foo e:click="=$widget"/>'))
            .should.be.exactly('S({foo:S(P.on("click",function($event,$widget){return $widget}))})');


    });

    it("@e:*", function () {

        // handler
        compiler.compile(dom.parseFromString('<foo e:click="boom"/>'))
            .should.be.exactly('S({foo:S(P.on("click",boom))})');

        // handler
        compiler.compile(dom.parseFromString('<foo e:click="boom">bar</foo>'))
            .should.be.exactly('S({foo:S(P.on("click",boom),"bar")})');

    });

    it("@o:*.*", function () {
        compiler.compile(dom.parseFromString('<foo o:foo.bar="boom"/>'))
            .should.be.exactly('S({foo:S(P.obs(foo,"bar",boom))})');

        compiler.compile(dom.parseFromString('<foo o:foo.bar="controller.boom">bar</foo>'))
            .should.be.exactly('S({foo:S(P.obs(foo,"bar",controller.boom),"bar")})');

        compiler.compile(dom.parseFromString('<foo o:foo.bar="boom(gas)">bar</foo>'))
            .should.be.exactly('S({foo:S(P.obs(foo,"bar",function(){return boom(gas)}),"bar")})');

        compiler.compile(dom.parseFromString('<foo o:foo.bar="{return boom(powder)}">bar</foo>'))
            .should.be.exactly('S({foo:S(P.obs(foo,"bar",function(){return boom(powder)}),"bar")})');

        // closure arguments
        compiler.compile(dom.parseFromString('<foo o:foo.bar="=$value">bar</foo>'))
            .should.be.exactly('S({foo:S(P.obs(foo,"bar",function($value){return $value}),"bar")})');

        compiler.compile(dom.parseFromString('<foo o:foo.bar="=$sender"/>'))
            .should.be.exactly('S({foo:S(P.obs(foo,"bar",function($value,$widget,$sender){return $sender}))})');

    });

    it("@* (with template expressions)", function () {

        // single expression
        compiler.compile(dom.parseFromString('<foo bar="${bar}"/>'))
            .should.be.exactly('{foo:{"@bar":bar}}');

        // basic concatenation ES5
        compiler.compile(dom.parseFromString('<foo bar="${qux}dox${fax}"/>'))
            .should.be.exactly('{foo:{"@bar":qux+"dox"+fax}}');

        //TODO 2.1.0: add ES6 mode
        //compiler.compileeES6(dom.parseFromString('<foo t:bar="${qux}dox${fax}"/>'))
        //    .should.be.exactly('{foo:{"@bar":`${qux}dox${fax}`}}');

        // single select
        compiler.compile(dom.parseFromString('<foo bar="{{bar}}"/>'))
            .should.be.exactly('S({foo:S({"@bar":P.sel($context,"bar")})})');

        // single select from another object
        compiler.compile(dom.parseFromString('<foo bar="{{foo.bar.qux}}"/>'))
            .should.be.exactly('S({foo:S({"@bar":P.sel(foo.bar,"qux")})})');

        // concatenated select
        compiler.compile(dom.parseFromString('<foo bar="{{bar}} and {{qux}}"/>'))
            .should.be.exactly('S({foo:S({"@bar":P.get(function($1,$2){return $1+" and "+$2},[P.sel($context,"bar"),P.sel($context,"qux")])})})');

        // single select within js expression
        compiler.compile(dom.parseFromString('<foo bar="${func({{foo.bar.qux}})}"/>'))
            .should.be.exactly('S({foo:S({"@bar":P.get(function($1){return func($1)},[P.sel(foo.bar,"qux")])})})');

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

})
;