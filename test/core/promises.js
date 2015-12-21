/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

//TODO: rewrite with BDD interface, stop using qunit shim
var chai = require("chai"),
    expect = chai.expect,
    commons = require("../../core/commons"),
    promise = commons.promise;

describe("runtime library / promises", function () {

            it("should implement all, then, defer", function () {
                function job1() {
                    var def = promise.defer();
                    setTimeout(function () {
                        def.resolve(42);
                    }, 10);
                    return def.promise;
                }

                return promise.all([job1()]).then(function (res) {
                    expect(res).to.deep.equal([42]);
                });
            });

            it("should handle throws from resolver ", function () {
                return new promise.Promise(function(resolve){
                    throw {myerror:42};
                }).then(function(){
                    // should not resolve
                    expect(true).not.to.be.ok;
                },function(e){
                    if (typeof window !=='undefined' && /PhantomJS/.test(window.navigator.userAgent)) {
                        // PhantomJS puts more data into the thrown object, so check if property is there
                        expect(e).to.have.property('myerror');
                    }
                    else
                        expect(e).to.deep.equal({myerror:42});

                });
            });

            it("should handle return promises from resolver", function () {
                return new promise.Promise(function(resolve){
                    resolve(promise.resolve({ok:42}));
                }).then(function(ok){
                    expect(ok).to.deep.equal({ok:42});
                },function(e){
                    // should not fail
                    expect(true).not.to.be.ok;
                });
            });
});