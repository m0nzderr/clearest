/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

var inherit = require("../../runtime/inherit.js");


describe("#runtime inherit",function(){
    function Foo(x){this.x=x;
        this.b = function(y){
            return this.c(y);
        }
    }

    Foo.prototype.a = function(y) {return this.x+y;}

    inherit(Bar,Foo);
    function Bar(x){
        Bar.super(this,x);
    }

    Bar.prototype.a = function(y) {
        return this.x*y - Bar.super().a.call(this,y);
    }

    Bar.prototype.c = function(y) {
        return this.x*y - Bar.super().a.call(this,y);
    }


    it("should be able to call super's constructor",function(){
        var bar = new Bar(42);
        bar.x.should.be.exactly(42);
    })

    it("should override methods",function(){
        var bar = new Bar(16);
        bar.a(4).should.be.exactly(16*4 - (16+4));
    })

    it("should allow virtual methods",function(){
        var bar = new Bar(33);
        bar.b(11).should.be.exactly(33*11 - (33+11));
    })


});


