/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict"
var Core = require("../../core/api"),
    chai = require("chai"),
    expect = chai.expect,
    commons = require("../../core/commons"),
    promise = commons.promise,
    delay = commons.delay;
    expect = chai.expect;

var isError = commons.is.error,
    inside = commons.inside;

describe("runtime library / core api", function () {

    var api = new Core();

    describe("api.get()", function () {

        it("should behave as .apply", function () {
            expect(api.get(function (x, y, z) {
                return x + 2 * y - z;
            }, [1, 2, 3])).to.be.equals(2);
        });

        it("but also resolving promises", function () {
            return api.get(function (x, y, z) {
                return x + 2 * y - z;
            }, [1, promise.resolve(2).then(delay(30)), 3]).then(function (result) {
                expect(result).to.be.equals(2);
            });
        });

        it("should handle argument errors",function(){

            var api = new Core();

            var errors =[];
            // override internal error hook
            api._error =function(o){
                errors.push(o);
            };

            return api.get(function (a,b,c) {
                expect(isError(b)).to.be.ok;
                expect(isError(a)).to.be.ok;
                expect(!isError(c)).to.be.ok;
            }, [promise.reject(1), promise.reject(2), 3]).then(function (result) {
                expect(errors).to.deep.equal([
                    commons.error(1),
                    commons.error(2)
                ]);
            });


        });

        it("should handle syncronous template errors (issue #21)",function(){

            var api = new Core();

            var errors =[];
            // override internal error hook
            api._error =function(o){
                errors.push(o);
            };

            return api.get(function (a) {
                throw 'failed'
            }, [promise.resolve(42)]).then(function (result) {
                expect(true).not.to.be.ok;
            },function(err){
                expect(err).to.be.ok;
            });


        });

    });

    describe("api.use()", function () {

        it("should pass control point to template code", function () {
            var called = false, originalContext = {};
            api.use(function (api, agg, context) {
                called = true;
                expect(context === originalContext).to.be.ok;
            }, originalContext);
            expect(called).to.be.ok;
        });

        it("... even if context is deferred", function () {
            var called = false, originalContext = {};
            var result = api.use(function (api, agg, context) {
                called = true;
                expect(context === originalContext).to.be.ok;
            }, promise.resolve(originalContext).then(delay(1)));
            expect(commons.is.promise(result)).to.be.ok;
            return commons.promise.resolve(result).then(function () {
                expect(called).to.be.ok;
            })
        });
    });

    describe("api.sel()", function () {

        it("should return propery data as is, if no iteration/filter specified", function () {
            expect(api.sel({data: "hello"}, 'data')).to.be.equals("hello");
        });

        it("should return combined iteration results", function () {
            expect(api.sel({data: "hello"}, 'data', function (e) {
                return e;
            })).to.be.equals("hello");
            expect(api.sel({data: ["hello", "world"]}, 'data', function (e, i) {
                return e + i;
            })).deep.equals(["hello0", "world1"]);
        });

        it("should deal with incomplete objects", function () {
            var o ={};
            inside(o).complete=function(o){
                return promise.resolve({data: "hello"});
            };
            return promise.resolve(api.sel(o, 'data')).then(function(data){
                expect(data).to.be.equals("hello");
            });
        });


        it("should not fail when incomplete resolution fails", function () {
            var o ={data:'hello'};
            inside(o).complete=function(o){
                inside(o).error='failed';
                return promise.reject(o);
            };
            return promise.resolve(api.sel(o, 'data')).then(function(data){
                // operation finishes
                // operation finishes
                expect(data).to.be.equals("hello");
                expect(commons.is.error(data));
            });
        });
    });


    describe("api.err()", function () {

        var ok = {},
            err0 = commons.error({}),
            err1 = commons.error({type: "1"}),
            err2 = commons.error({type: "2"}),
            err3 = commons.error(new ReferenceError());

        it("should correctly detect errors within objects", function () {
            expect(!api.err(ok)).to.be.ok;
            expect(api.err(err0)).to.be.ok;
            expect(api.err(err1)).to.be.ok;
            expect(api.err(err2)).to.be.ok;
            expect(api.err(err3)).to.be.ok;
            expect(!api.err(new Error())).to.be.ok;
        });

        it("should correctly detect error types", function () {
            expect(!api.err(ok, 0, "1")).to.be.ok;
            expect(api.err(err1, 0, "1")).to.be.ok;
            expect(api.err(err2, 0, "2")).to.be.ok;
            expect(api.err(err3, 0, "class:ReferenceError")).to.be.ok;

            expect(!api.err(err0, 0, "1")).to.be.ok;
            expect(!api.err(err1, 0, "class:ReferenceError")).to.be.ok;
            expect(!api.err(err2, 0, "1")).to.be.ok;
            expect(!api.err(err3, 0, "2")).to.be.ok;
        });


        it("should apply filters", function () {

            function filter1(e) {
                expect(api.err(e)).not.to.be.ok;
                e.filtered1 = 1;
                return e
            }

            function filter2(e) {
                e.filtered2 = 1;
                return e
            }

            expect(api.err(ok, 0, "1", filter1)).not.be.ok;
            expect(api.err(err1, 0, "1", filter1)).to.have.property("filtered1");
            expect(api.err(err2, 0, "2", filter1)).to.have.property("filtered1");
            expect(api.err(err3, 0, "class:ReferenceError", filter1)).to.have.property("filtered1");

            expect(api.err(err0, 0, "1", filter1)).not.be.ok;
            expect(api.err(err1, 0, "class:ReferenceError", filter1)).not.be.ok;
            expect(api.err(err2, 0, "1", filter1)).not.be.ok;
            expect(api.err(err3, 0, "2", filter1)).not.be.ok;

            expect(api.err(err1, 0, filter2)).to.have.property("filtered2");
            expect(api.err(err2, 0, filter2)).to.have.property("filtered2");


        });

        it("should implement probe api", function () {

            var err;

            err =  commons.error(1);
            err.test=1;
            expect(commons.is.error(err)).to.be.ok;
            api.err(err,1);
            expect(commons.is.error(err)).not.to.be.ok;


            err =  commons.error(2);
            err.test=2;
            expect(commons.is.error(err,"1")).not.to.be.ok;
            api.err(err,1,"1");
            expect(commons.is.error(err)).to.be.ok;
        });
    });


    describe("api.cnt()", function () {

        //TODO 2.1.0: test behavior for incomplete objects

        it("should be a binary indicator for singletones", function () {
            expect(api.cnt({data: "hello"}, 'data')).to.be.equals(1);
            expect(api.cnt({data: "hello"}, ['data', 'foo'])).deep.equals([1, 0]);
            expect(api.cnt({data: "hello", foo: false}, ['data', 'foo'])).deep.equals([1, 0]);
            expect(api.cnt({data: "hello", foo: true}, ['data', 'foo'])).deep.equals([1, 1]);
            expect(api.cnt({data: "", foo: true}, ['data', 'foo'])).deep.equals([0, 1]);
        });

        it("should return array length", function () {
            expect(api.cnt({data: ["hello"]}, 'data')).to.be.equals(1);
            expect(api.cnt({data: ["hello"], foo: []}, ['data', 'foo'])).deep.equals([1, 0]);
            expect(api.cnt({data: ["hello"], foo: {}}, ['data', 'foo'])).deep.equals([1, 1]);
        });
    });


});
