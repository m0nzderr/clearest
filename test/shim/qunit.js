/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var chai = require("chai"), $q = require("q");
var context = {expect: 0, deferred: {}};

module.exports = {
    test: it,
    asyncTest: function (meaning, fn) {
        context.deferred = $q.defer();
        it(meaning, function () {
            fn();
            return context.deferred.promise;
        });
    },
    ok: function (a, meaning) {
        context.expect--;
        return chai.expect(a).equal(true);
    },
    equal: function (a, b, meaning) {
        context.expect--;
        return chai.expect(a).equal(b);
    },
    deepEqual: function (a, b, meaning) {
        context.expect--;
        return chai.expect(a).deep.equal(b);
    },
    expect: function (n) {
        context.expect = n;
    },
    start: function () {
        if (context.expect == 0) {
            context.deferred.resolve();
        } else {
            context.deferred.reject(context.expect + " assertions were not received");
        }
    }
};

