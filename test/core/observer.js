/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

//TODO: rewrite with BDD interface, stop using qunit shim
var //qunit = require("./../shim/qunit"),
    //test = qunit.test,
    //equal = qunit.equal,
    //ok = qunit.ok,
    chai = require("chai"),
    expect = chai.expect,
    commons = require("../../core/commons"),
    observer = require("../../core/observer"),
    subscribe = observer .subscribe,
    unsubscribe = observer .unsubscribe,
    notify = observer .notify,
    send = observer .send,
    CLEAREST = commons.constant.CLEAREST,
    inside = commons.inside;

describe("core  ", function () {

    describe("observer / subscribe-notify", function () {

        it('should not break on unsupported objects', function () {
            // nothing happens:
            expect(subscribe(undefined, 'foo', function () {
            })).to.be.equal(undefined);
            expect(subscribe(null, 'foo', function () {
            })).to.be.equal(undefined);
            expect(subscribe(42, 'foo', function () {
            })).to.be.equal(undefined);

            unsubscribe(null);
            unsubscribe(inside({}));

            notify(42);
            notify(null);
            notify(undefined);

        });

        it('subscribe should follow the contract', function () {

            function obs1() {
            };
            function obs2() {
            };
            var o = {};


            // first subscription
            subscribe(o, 'foo', obs1).should.be.true();
            subscribe(o, 'foo', obs2).should.be.true();

            // second subscription
            subscribe(o, 'foo', obs2).should.be.false();
            subscribe(o, 'foo', obs1).should.be.false();

            subscribe(o, 'bar', obs2).should.be.true();

            subscribe(o, '*', obs2).should.be.true();

            // those should be irrelevant after '*'
            subscribe(o, 'bar', obs2).should.be.false();
            subscribe(o, 'foo', obs2).should.be.false();
            subscribe(o, 'qux', obs2).should.be.false();

            // internal strcture of observable should look like this
            expect(o[CLEAREST].sub).to.deep.equal({
                'foo': [obs1, obs2],
                'bar': [obs2],
                '*': [obs2]
            });

            // internal strcture of observer should look like this
            expect(obs1[CLEAREST].obs).to.deep.equal([{k: 'foo', o: o, idx: 0}]);
            expect(obs2[CLEAREST].obs).to.deep.equal([{k: 'foo', o: o, idx: 1}, {k: 'bar', o: o, idx: 0}, {
                k: '*',
                o: o,
                idx: 0
            }]);
        });

        it('notify should behave as expected', function () {

            var actual1 = {o: [], k: [], d: []},
                actual2 = {o: [], k: [], d: []},
                expected1 = {o: [], k: [], d: []},
                expected2 = {o: [], k: [], d: []};

            var handler = function (log) {
                return function (d, o, k) {
                    log.o.push(o);
                    log.k.push(k);
                    log.d.push(d);
                }
            }

            function clear(log) {
                log.o = [];
                log.k = [];
                log.d = [];
            }

            function assertLogs() {
                // check
                expect(actual1).deep.equal(expected1);
                expect(actual2).deep.equal(expected2);

                // cleanup
                clear(actual1);
                clear(actual2);
                clear(expected1);
                clear(expected2);

            }

            var obs1 = handler(actual1);
            var obs2 = handler(actual2);

            var call1 = handler(expected1);
            var call2 = handler(expected2);

            var o = {};

            // subscribe once on foo
            subscribe(o, 'foo', obs1);
            subscribe(o, 'foo', obs2);

            // subscribe twice on bar
            subscribe(o, 'bar', obs2);
            subscribe(o, 'bar', obs2);

            // notify foo once
            notify(o, 'foo', 1);

            // expect two calls on foo:
            call1(1, o, 'foo');
            call2(1, o, 'foo');

            assertLogs();

            // notify bar once
            notify(o, 'bar', 2);

            // expect one call to obs2
            call2(2, o, 'bar');

            assertLogs();

            // nofiy foo and bar
            notify(o, '*', 3);

            // expect:
            call1(3, o, 'foo');
            call2(3, o, 'foo');
            call2(3, o, 'bar');

            assertLogs();

            // subscribe onbserver 2 on '*'
            subscribe(o, '*', obs2);

            // notify foo
            notify(o, 'foo', 1);

            // expect
            call1(1, o, 'foo');
            call2(1, o, 'foo');

            assertLogs();

            notify(o, 'bar', 2);

            call2(2, o, 'bar');

            assertLogs();

            notify(o, '*', 3);

            call1(3, o, 'foo');
            call2(3, o, '*');

            assertLogs();
        });

        it('unsubscribe should behave as expected', function () {

            var obs1 = function () {
            };
            var obs2 = function () {
            };
            var o = {};

            subscribe(o, 'foo', obs1);
            subscribe(o, 'foo', obs2);
            subscribe(o, 'bar', obs2);

            subscribe(o, '*', obs2);

            unsubscribe(obs1);

            // observer removed from observable
            expect(o[CLEAREST].sub).deep.equal({
                'foo': [null, obs2],
                'bar': [obs2],
                '*': [obs2]
            })

            // observable removed from observer
            expect(obs1[CLEAREST].obs).to.be.equal(undefined);

            // after new subscription, memory should be reused
            subscribe(o, 'foo', obs1);
            expect(o[CLEAREST].sub).deep.equal({
                'foo': [obs1, obs2],
                'bar': [obs2],
                '*': [obs2]
            })
        });


    });


    describe("observer / send", function () {
        it('should notify and store', function () {
            var o = {}, log = {};
            subscribe(o, '*', function (data, o, k) {
                log[k] = data;
            });
            // will
            send(o, {foo: "bar"});
            expect(log).deep.equal({foo: "bar"});
            expect(o.foo).to.be.equal("bar");
        });

        it('should notify and store (single field)', function () {
            var o = {}, log = {};
            subscribe(o, '*', function (data, o, k) {
                log[k] = data;
            });
            // will
            send(o, "foo", "bar");
            expect(log).deep.equal({foo: "bar"});
            expect(o.foo).to.be.equal("bar");
        });

        it('should notify with specific data', function () {
            var o = {}, log = {};
            subscribe(o, '*', function (data, o, k) {
                log[k] = data;
            });
            // will
            send(o, {foo: "bar"}, false);
            expect(log).deep.equal({foo: false});
            expect(o.foo).to.be.equal("bar");
        });
    });

});