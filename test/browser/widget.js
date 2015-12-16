/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var commons = require("../../core/commons"),
    html = require("../../core/html"),
    interpreter = require("eval"),
    Processor = require("../../tool/processor.js"),
    Builder = require("../../interface/builder"),
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
        return new Widget(browser, interpreter(processor.compile(templateString),{require:require}));
    }


    describe("renderer", function(){
        it("should render some elements",function(){
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
            var widget = make("<foo><t:control>return {build:function(el){this.el=el; el.built=true;},destroy:function(){this.el.destroyed=true;}}</t:control>" +
                "<bar><t:control>return {build:function(el){this.el=el; el.built=true;}}</t:control></bar>Hello World</foo>");
            return promise.resolve(widget.build(browser.find("app")))
                .then(function(widget){
                    expect( browser.find("app-foo1").built).to.be.ok;
                    expect( browser.find("app-bar1").built).to.be.ok;
                    return widget;
                }).then(function(widget){  return widget.destroy()}).then(function(){
                    expect( browser.find("app-foo1").destroyed).to.be.ok;
                   // expect( browser.find("app-bar1").destroyed).to.be.ok;
                });
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
    })
});

