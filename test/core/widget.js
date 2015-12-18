/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var commons = require("../../core/commons"),
    observer = require("../../core/observer"),
    html = require("../../core/html"),
    interpreter = require("eval"),
    Processor = require("../../tool/processor.js"),
    Builder = require("../../interface/app"),
    Widget =  require("../../browser/widget");

var chai = require("chai"),
    expect = chai.expect;

commons.inherit(BrowserShim, Builder);
function BrowserShim(){
    this.dom =  {};
    this.render=function(view,presentation){
        this.dom[view.id].content=html(presentation);
    };
    this.find = function(id){
        return this.dom[id] || (this.dom[id]={id:id});
    };

    this.getContent=function(id){
        return this.dom[id].content;
    }
}

describe("runtime library / widget",function(){

    var browser = new BrowserShim();
    var processor = new Processor();

    function make(templateString){
        var template  = processor.compile(templateString);
        return new Widget(browser, interpreter(template,{require:require}));
    }


    describe("renderer", function(){
        it("should render static elements",function(){
            var widget = make("<foo>Hello World</foo>");
            return promise.resolve(widget.build(browser.find("myId"))).then(function(){
                   browser.getContent("myId").should.be.exactly("<foo>Hello World</foo>");
            });
        });
    });

    describe("component model", function(){
        it("should execute controller code",function(){
            var widget = make("<foo><t:control>this.tested=true;</t:control><bar><t:control>this.tested=true;</t:control></bar>Hello World</foo>");
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(){
                    expect( browser.find("app-foo1").tested).to.be.ok;
                    expect( browser.find("app-bar1").tested).to.be.ok;
            });
        });

        it("should build and destroy components",function(){
            var resolved = 0;
            var widget = make("<foo><t:control>return {build:function(el){this.el=el; el.built=true;},destroy:function(){this.el.destroyed=true;}}</t:control>" +
                "<bar><t:control>return {build:function(el){this.el=el; el.built=true;}}</t:control></bar>Hello World</foo>");
            var chain =  promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    expect( browser.find("app-foo1").built).to.be.ok;
                    expect( browser.find("app-bar1").built).to.be.ok;
                    return widget;
                }).then(function(widget){  return widget.destroy()}).then(function(){
                    expect( browser.find("app-foo1").destroyed).to.be.ok;
                   // expect( browser.find("app-bar1").destroyed).to.be.ok;
                });

            expect(commons.is.promise(chain)).to.be.ok;

            return chain;

        });

        it("should build and destroy asynchronous components",function(){
            var widget = make("<foo2><t:require commons='../../runtime'/><t:control>return {build:function(el){return commons.promise.resolve(this).then(function(self){self.el=el; el.built=true;})},destroy:function(){this.el.destroyed=true;}}</t:control>" +
                "Hello World</foo2>");
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    expect( browser.find("app-foo21").built).to.be.ok;
                    return widget;
                }).then(function(widget){  return widget.destroy()}).then(function(){
                    expect( browser.find("app-foo21").destroyed).to.be.ok;
                });
        });

        it("should instantiate and build other widgets",function(){
            var widget = make("<w:foo><w:bar><t:control>this.widget=arguments[0];</t:control>Hello World</w:bar></w:foo>");
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    expect( browser.find("app-foo1-bar1").widget).to.be.ok;
                    return widget;
                });
        })


        it("should instantiate and build other widgets #2",function(){
            var widget = make('<t:context test="{}"><t:control>this.test=test;</t:control><w:foo t:value="{{v}}"/><w:bar t:value="{{v}}"/></t:context>');
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    expect( browser.find("app-foo1")).to.be.ok;
                    expect( browser.find("app-foo2")).to.be.ok;
                    return widget;
                });
        })

        it("should process rebuild requests (no promises)",function(){
            var widget = make('<t:get scope="{}"><w:foo><s:test from="scope"/><t:control>this.scope=scope; scope.widget=arguments[0];</t:control></w:foo></t:get>');
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    // get scope
                    var scope = browser.find("app-foo1").scope;
                    expect( scope).to.be.ok;


                    expect( browser.find("app-foo1").content == "").to.be.ok;

                    // this must trigger updateRequest flag
                    observer.send(scope, {test:"Hello World"});

                    return promise.resolve(widget.process()).then(function(){
                        // inner widget was rebuilt
                        expect( browser.find("app-foo1").content == "Hello World").to.be.ok;
                        return widget;
                    });
                });
        })

        it("should process update requests (no promises)",function(){
            var widget = make('<t:get scope="{test:{}}"><w:foo><t:get test="scope.test"/><t:control>this.scope=scope; scope.widget=arguments[0];</t:control></w:foo></t:get>');
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    // get scope
                    var scope = browser.find("app-foo1").scope;
                    expect( scope).to.be.ok;

                    expect( browser.find("app-foo1").content == "").to.be.ok;

                    // this must trigger updateRequest flag
                    observer.send(scope.test, {data:"Hello World"});

                    return promise.resolve(widget.process()).then(function(){
                        // inner widget was rebuilt
                        expect( browser.find("app-foo1").content == "<data>Hello World</data>").to.be.ok;
                        return widget;
                    });
                });
        })

        it("should process rebuild requests (with promises)",function(){
            var widget = make('<t:require rt="../../runtime"><t:get scope="rt.promise.resolve({test:\'OK\'})"><w:foo><t:get promise="rt.promise.resolve({})"><s:test from="scope"/></t:get><t:control>this.scope=scope; scope.widget=arguments[0];</t:control></w:foo></t:get></t:require>');
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    // get scope
                    var scope = browser.find("app-foo1").scope;
                    expect( scope).to.be.ok;
                    expect( browser.find("app-foo1").content == "OK").to.be.ok;
                    // this must trigger updateRequest flag
                    observer.send(scope, {test:"Hello World"});
                    return promise.resolve(widget.process()).then(function(){
                        // inner widget was rebuilt
                        expect( browser.find("app-foo1").content == "Hello World").to.be.ok;
                        return widget;
                    });
                });
        })

        it("should process update requests (with promises)",function(){
            var widget = make('<t:require rt="../../runtime"><t:get scope="rt.promise.resolve({test:{}})"><w:foo><t:get promise="rt.promise.resolve({})"><t:get test="scope.test"/></t:get><t:control>this.scope=scope; scope.widget=arguments[0];</t:control></w:foo></t:get></t:require>');
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    // get scope
                    var scope = browser.find("app-foo1").scope;

                    expect(scope).to.be.ok;
                    expect(browser.find("app-foo1").content == "").to.be.ok;
                    // this must trigger updateRequest flag
                    observer.send(scope.test, {data:"Hello World"});
                    return promise.resolve(widget.process()).then(function(){
                        // inner widget was rebuilt
                        expect( browser.find("app-foo1").content == "<data>Hello World</data>").to.be.ok;
                        return widget;
                    });
                });
        })


    })
});

