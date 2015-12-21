/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

//TODO: rewrite with BDD interface, stop using qunit shim
var qunit = require("./../shim/qunit"),
    test = qunit.test,
    deepEqual = qunit.deepEqual,
    equal = qunit.equal,
    ok = qunit.ok,
    chai = require("chai"),
    expect = chai.expect,
    commons = require("../../core/commons"),
    promise = commons.promise,
    inherit = commons.inherit,
    is = commons.is,
    inside = commons.inside,
    fin = commons.fin,
    each = commons.each,
    error = commons.error,
    CLEAREST = commons.constant.CLEAREST;

describe("runtime library / commons", function () {

    describe("basic functions", function () {

        test('is.array', function () {
            equal(is.array([]), true, 'is.Array([])=true');
            equal(is.array({}), false, 'is.Array({})=false');
            equal(is.array('foo'), false, 'is.Array("foo")=false');
            equal(is.array(null), false, 'is.Array(null)=false');
            equal(is.array(undefined), false, 'is.Array(undefined)=false');
        });

        test('is.fun', function () {
            equal(is.fun([]), false, 'is.Function([])=false');
            equal(is.fun({}), false, 'is.Function({})=false');
            equal(is.fun(function () {
            }), true, 'is.Function(function(){})=true');
            equal(is.fun(undefined), false, 'is.Function(undefined)=false');
            equal(is.fun(null), false, 'is.Function(null)=false');
        });

        test('is.value', function () {

            equal(is.value(123), true, 'is.Value(123)=true');
            equal(is.value('foo'), true, 'is.Value("foo")=true');
            equal(is.value(!'foo'), true, 'is.Value(!"foo")=true');
            equal(is.value([]), false, 'is.Value([])=false');
            equal(is.value({}), false, 'is.Value({})=false');
            equal(is.value(function () {
            }), false, 'is.Value(function(){})=false');
            equal(is.value(undefined), false, 'is.Value(undefined)=false');
            equal(is.value(null), false, 'is.Value(null)=false');

        });

        test('is.error and error', function () {
            var o = {};
            ok(!is.error(o));
            ok(is.error(error(o)));
        });

        test('is.fun', function () {
            ok(is.fun(function () {
            }));
            ok(!is.fun({}));
            ok(!is.fun(new (function () {
            })));
        });

        test('fin and _in', function () {
            var o = {};
            inside(o).foo = 42;
            fin("k", o).bar = 42;

            equal(o[commons.constant.CLEAREST].foo, 42, 'object were created');
            equal(o['k'].bar, 42, 'object were created');

            equal(inside(o), o[commons.constant.CLEAREST], 'object returned');
            equal(fin("k", o), o['k'], 'object returned');
        });

        test('is.promise', function () {

            equal(is.promise(123), false, 'is.promise(123)=false');
            equal(is.promise('foo'), false, 'is.promise("foo")=false');
            equal(is.promise(!'foo'), false, 'is.promise(!"foo")=false');
            equal(is.promise([]), false, 'is.promise([])=false');
            equal(is.promise({}), false, 'is.promise({})=false');
            equal(is.promise(function () {
            }), false, 'is.promise(function(){})=false');
            equal(is.promise(undefined), false, 'is.Promise(undefined)=false');
            equal(is.promise(null), false, 'is.promise(null)=false');
            equal(is.promise(promise.defer()), false, 'is.promise(deferred)=false');
            equal(is.promise(promise.defer().promise), true, 'is.promise(deferred.promise)=true');
        });

        test('each', function () {

            each('foo', function (el) {
                equal(el, 'foo', 'singletone');
            });

            var buf;

            buf = [];
            each(['foo'], function (el) {
                buf.push(el);
            });
            deepEqual(['foo'], buf, 'single element');

            buf = [];
            each(['foo', 1, 2, 3], function (el) {
                buf.push(el);
            });
            deepEqual(['foo', 1, 2, 3], buf, 'plain array');

            buf = [];
            each(['foo', [1], 2, 3], function (el) {
                buf.push(el);
            });
            deepEqual(['foo', 1, 2, 3], buf, 'deep array');

            buf = [];
            each([[['foo', [[1]]], [], 2], 3], function (el) {
                buf.push(el);
            });
            deepEqual(['foo', 1, 2, 3], buf, 'very deep array');

        });

    });

    describe("inherit pattern", function () {
        function Foo(x) {
            this.x = x;
            this.b = function (y) {
                return this.c(y);
            }
        }

        Foo.prototype.a = function (y) {
            return this.x + y;
        }

        inherit(Bar, Foo);
        function Bar(x) {
            Bar.super(this, x);
        }

        Bar.prototype.a = function (y) {
            return this.x * y - Bar.super().a.call(this, y);
        }

        Bar.prototype.c = function (y) {
            return this.x * y - Bar.super().a.call(this, y);
        }


        it("should be able to call super's constructor", function () {
            var bar = new Bar(42);
            bar.x.should.be.exactly(42);
        })

        it("should override methods", function () {
            var bar = new Bar(16);
            bar.a(4).should.be.exactly(16 * 4 - (16 + 4));
        })

        it("should allow virtual methods", function () {
            var bar = new Bar(33);
            bar.b(11).should.be.exactly(33 * 11 - (33 + 11));
        })
    });



});