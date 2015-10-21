/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict"
var Api = require("../../runtime/api"),
    chai = require("chai"),
    commons = require("../../commons"),
    promise = require("../../commons").promise,
    expect = chai.expect;

describe("runtime library / core api", function () {

    var api = new Api();

    describe("api.get()", function () {

        it("should behave as .apply", function () {
            expect(api.get(function (x, y, z) {
                return x + 2 * y - z;
            }, [1, 2, 3])).to.be.equals(2);
        });

        it("but also resolving promises", function () {
            return api.get(function (x, y, z) {
                return x + 2 * y - z;
            }, [1, promise(2).delay(30), 3]).then(function (result) {
                expect(result).to.be.equals(2);
            });
        });
    });

    describe("api.use()", function () {

        it("should pass control point to template code", function () {
            var called = false, originalContext = {};
            api.use(function (context) {
                called = true;
                expect(context === originalContext).to.be.ok;
            }, originalContext);
            expect(called).to.be.ok;
        });

        it("... even if context is deferred", function () {
            var called = false, originalContext = {};
            var result = api.use(function (context) {
                called = true;
                expect(context === originalContext).to.be.ok;
            }, promise(originalContext).delay(1));
            expect(commons.is.promise(result)).to.be.ok;
            return commons.promise(result).then(function () {
                expect(called).to.be.ok;
            })
        });
    });

    describe("api.sel()", function () {

        //TODO: test behavior for incomplete objects

        it("should return propery data as is, if no iteration/filter specified", function () {
            expect( api.sel({data:"hello"},'data')).to.be.equals("hello");
        });

        it("should return combined iteration results", function () {
            expect( api.sel({data:"hello"},'data',function(e){return e;})).to.be.equals("hello");
            expect( api.sel({data:["hello", "world"]},'data',function(e,i){return e+i;})).deep.equals(["hello0", "world1"]);
            expect( api.sel({data:["hello", ["world"]]},'data',function(e,i){return e+i;})).deep.equals(["hello0", "world1"]);
        });

        it("should return combined iteration results", function () {
            expect( api.sel({data:"hello"},'data',function(e){return e;})).to.be.equals("hello");
            expect( api.sel({data:["hello", "world"]},'data',function(e,i){return e+i;})).deep.equals(["hello0", "world1"]);
            expect( api.sel({data:["hello", ["world"]]},'data',function(e,i){return e+i;})).deep.equals(["hello0", "world1"]);
        });

    });


    describe("api.cnt()", function () {

        //TODO: test behavior for incomplete objects

        it("should be a binary indicator for singletones", function () {
            expect( api.cnt({data:"hello"},'data')).to.be.equals(1);
            expect( api.cnt({data:"hello"},['data','foo'])).deep.equals([1,0]);
            expect( api.cnt({data:"hello", foo:false},['data','foo'])).deep.equals([1,0]);
            expect( api.cnt({data:"hello", foo:true},['data','foo'])).deep.equals([1,1]);
            expect( api.cnt({data:"", foo:true},['data','foo'])).deep.equals([0,1]);
        });

        it("should return array length", function () {
            expect( api.cnt({data:["hello"]},'data')).to.be.equals(1);
            expect( api.cnt({data:["hello"],foo:[]},['data','foo'])).deep.equals([1,0]);
            expect( api.cnt({data:["hello"],foo:{}},['data','foo'])).deep.equals([1,1]);
        });
    });


});
