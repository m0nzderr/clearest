/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
"use strict";
var qunit = require("../shim/qunit.js"), test = qunit.test, deepEqual = qunit.deepEqual, equal = qunit.equal, ok = qunit.ok,
    commons = require("../../runtime/commons.js"),
    $q = require("q"),
    is = commons.is,
    each = commons.each;

describe("#clearest-runtime", function () {

    describe("#commons", function () {

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
            equal(is.promise($q.defer()), false, 'is.promise(deferred)=false');
            equal(is.promise($q.defer().promise), true, 'is.promise(deferred.promise)=true');
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

        test("promises ", function () {

            function job() {
                var def = $q.defer();
                setTimeout(function () {
                    def.resolve(42);
                }, 10);
                return def.promise;
            }

            it("should work within test environment", function () {
                return $q.all(job()).then(function (res) {
                    equal(res, 42, "promises seem to work across testing suite");
                    //done();
                });
            })

        })

    });

});