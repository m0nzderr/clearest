/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
//TODO: rewrite with BDD interface, stop using qunit shim
var qunit = require("../shim/qunit.js"), test = qunit.test, deepEqual = qunit.deepEqual, equal = qunit.equal, ok = qunit.ok, asyncTest = qunit.asyncTest, start = qunit.start, expect = qunit.expect;

var $q = require("q"), is = require("../../commons").is,
    agg = require("../../runtime/aggregator.js");

describe("runtime library / aggregator", function () {



        test("compose contract implementation", function () {

            ok(is.composit(agg.compose(["foo", "bar"])), 'compose() returns composit');

            function check(seq, data, msg) {
                data.__clearest__ = {seq: seq};
                deepEqual(agg.compose(seq), data, msg);
            }

            check(["foo", "bar"], {$: ['foo', 'bar']}, 'aggregate value nodes');
            check(["foo", {bar: 'qux'}], {$: 'foo', bar: 'qux'}, 'aggregate value nodes');
            check([{}, {}], {}, 'aggregate empty objects');
            check([{bar: 'qux1'}, 'foo', {bar: 'qux2'}], {$: 'foo', bar: ['qux1', 'qux2']}, 'aggregate objects');
            check([{bar: ['qux1', 'qux2']}, 'foo', {bar: 'qux3'}], {
                $: 'foo',
                bar: ['qux1', 'qux2', 'qux3']
            }, 'aggregate arrays');
            check([{bar: ['qux1', 'qux2']}, null, {bar: 'qux3'}], {bar: ['qux1', 'qux2', 'qux3']}, 'drop null arguments');
            check([{bar: ['qux1', 'qux2']}, null, {bar: null}], {bar: ['qux1', 'qux2']}, 'drop null properties');

        });

        test("aggregation of basic objects", function () {

            equal(agg('foo'), 'foo', 'agg: singletones are returned');
            deepEqual(agg({}), {}, 'agg: singletones are returned');
            deepEqual(agg({}, null), {}, 'agg: singletones are returned');
            deepEqual(agg(null, {}, null), {}, 'agg: singletones are returned');
            deepEqual(agg(null, [{}, null]), {}, 'agg: singletones are returned');
            deepEqual(agg([null, [{}, null]]), {}, 'agg: singletones are returned');

            deepEqual(agg(null), undefined, 'agg: nulls are dropped');
            deepEqual(agg([null, null]), undefined, 'agg: nulls are dropped');
            deepEqual(agg([null, [null]]), undefined, 'agg: nulls are dropped');

        });

        test("aggregation of objects with controllers", function () {
            var f1 = function () {
            }, f2 = function () {
            };

            deepEqual(agg(f1), {__clearest__: {ctl: [f1]}}, 'controller only');
            deepEqual(agg(f1, {}), {__clearest__: {ctl: [f1]}}, 'controller only');
            deepEqual(agg(f2, null, f1, {}), {__clearest__: {ctl: [f2, f1]}}, 'controller only');
            deepEqual(agg(f2, {foo: 'data'}, f1), {__clearest__: {ctl: [f2, f1]}, foo: 'data'}, 'controllers and data');

            deepEqual(agg(agg(f1, {bar: 'data'}), agg(f2, {foo: 'data'})).__clearest__.ctl, [[f1], [f2]], 'controllers from different objects do combine now!');
            deepEqual(agg(f1, {bar: 'data'}, f2, {foo: 'data'}).__clearest__.ctl, [f1, f2], 'controllers from differente objects do combine!');

        });


        asyncTest("aggregation of asynchronous objects (~100ms delayed promises)", function () {

            function cook(data) {
                var def = $q.defer();
                setTimeout(function () {
                    def.resolve(data)
                }, Math.round(Math.random() * 100));
                return def.promise;
            }

            var expected = agg({foo: 'foo1'}, {foo: 'foo2'}, {foo: {bar: 'foo3'}}, {foo: 'foo4'}, {foo: {bar: 'foo5'}});


            function check(message) {
                return function (result) {
                    deepEqual(result, expected, message);

                }
            }

            var jobs = [
                // deferred argument
                agg({foo: 'foo1'}, cook({foo: 'foo2'}), {foo: {bar: 'foo3'}}, {foo: 'foo4'}, {foo: {bar: 'foo5'}}).then(check('deferred arguments #1')),

                agg({foo: 'foo1'}, {foo: 'foo2'}, cook({foo: {bar: 'foo3'}}), {foo: 'foo4'}, {foo: {bar: 'foo5'}}).then(check('deferred arguments #2')),

                // deferred array
                agg({foo: 'foo1'}, {foo: 'foo2'}, cook([{foo: {bar: 'foo3'}}, {foo: 'foo4'}]), {foo: {bar: 'foo5'}}).then(check('deferred array')),

                // deferred key
                agg({foo: 'foo1'}, {foo: 'foo2'}, {foo: cook({bar: 'foo3'})}, {foo: 'foo4'}, {foo: {bar: 'foo5'}}).then(check('deferred key (single)')),

                // deferred value
                agg({foo: 'foo1'}, {foo: cook('foo2')}, {foo: {bar: 'foo3'}}, {foo: 'foo4'}, {foo: {bar: 'foo5'}}).then(check('deferred value')),

                // muliple deferreds
                agg({foo: 'foo1'}, cook(cook({foo: 'foo2'})), {foo: {bar: 'foo3'}}, {foo: 'foo4'}, {foo: {bar: 'foo5'}}).then(check('deferred deferred')),

                // muliple deferreds
                agg({foo: 'foo1'}, cook(cook(cook({foo: 'foo2'}))), {foo: {bar: 'foo3'}}, {foo: 'foo4'}, {foo: {bar: 'foo5'}}).then(check('deferred deferred deferred')),

                // race
                agg(cook({foo: 'foo1'}), cook({foo: 'foo2'}), {foo: cook({bar: 'foo3'})}, cook({foo: 'foo4'}), cook({foo: {bar: 'foo5'}})).then(check('race')),

                agg(cook([cook([{foo: 'foo1'}, cook(cook({foo: 'foo2'}))]), cook([{foo: cook({bar: 'foo3'})}, {foo: 'foo4'}, {foo: {bar: 'foo5'}}])])).then(check('crazy stack!'))

                // deferred deferred
            ];

            expect(jobs.length);

            $q.all(jobs).then(start);


        });

});