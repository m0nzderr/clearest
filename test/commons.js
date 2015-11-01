/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

//TODO: rewrite with BDD interface, stop using qunit shim
var qunit = require("./shim/qunit"),
    test = qunit.test,
    deepEqual = qunit.deepEqual,
    equal = qunit.equal,
    ok = qunit.ok,
    chai = require("chai"),
    expect = chai.expect,
    commons = require("../commons"),
    promise = commons.promise,
    inherit = commons.inherit,
    is = commons.is,
    inside = commons.inside,
    fin = commons.fin,
    each = commons.each,
    subscribe = commons.subscribe,
    unsubscribe = commons.unsubscribe,
    notify = commons.notify,
    error = commons.error,
    send = commons.send,
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

        test("promise basic mocontract", function () {
            //TODO: add more contract tests for reject, throw, fail

            it("should implement all, then, defer", function () {
                function job1() {
                    var def = promise.defer();
                    setTimeout(function () {
                        def.resolve(42);
                    }, 10);
                    return def.promise;
                }

                return promise.all(job1()).then(function (res) {
                    equal(res, 42, "promises seem to work ");
                    //done();
                });
            })

        })
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


    describe("observable pattern", function () {

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
                return function (o, k, d) {
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
            call1(o, 'foo', 1);
            call2(o, 'foo', 1);

            assertLogs();

            // notify bar once
            notify(o, 'bar', 2);

            // expect one call to obs2
            call2(o, 'bar', 2);

            assertLogs();

            // nofiy foo and bar
            notify(o, '*', 3);

            // expect:
            call1(o, 'foo', 3);
            call2(o, 'foo', 3);
            call2(o, 'bar', 3);

            assertLogs();

            // subscribe onbserver 2 on '*'
            subscribe(o, '*', obs2);

            // notify foo
            notify(o, 'foo', 1);

            // expect
            call1(o, 'foo', 1);
            call2(o, 'foo', 1);

            assertLogs();

            notify(o, 'bar', 2);

            call2(o, 'bar', 2);

            assertLogs();

            notify(o, '*', 3);

            call1(o, 'foo', 3);
            call2(o, '*', 3);

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


    describe("commons / send", function () {
        it('should notify and store', function () {
            var o = {}, log = {};
            subscribe(o, '*', function (o, k, data) {
                log[k] = data;
            });
            // will
            send(o, {foo: "bar"});
            expect(log).deep.equal({foo: "bar"});
            expect(o.foo).to.be.equal("bar");
        });

        it('should notify with specific data', function () {
            var o = {}, log = {};
            subscribe(o, '*', function (o, k, data) {
                log[k] = data;
            });
            // will
            send(o, {foo: "bar"}, false);
            expect(log).deep.equal({foo: false});
            expect(o.foo).to.be.equal("bar");
        });
    });

});