/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var is_ = function (o) {
        return o ? o._ !== undefined : false;
    },
    is = {
        _: is_,
        array: Array.isArray || function (a) {
            return a instanceof Array;
        },
        fun: function (o) {
            return typeof(o) == 'function'
        },
        value: function (o) {
            var t = typeof o;
            return t === 'string' || t === 'number' || t === 'boolean';
        },
        promise: function (o) {
            return o !== undefined && o !== null && is.fun(o.then) && is.fun(o.done);
        },
        composit: function (o) {
            return is_(o) && o._.seq !== undefined;
        },
        incomplete: function (o) {
            return is_(o) && o._.complete !== undefined;
        },
        error: function (o) {
            return is_(o) && o._.error !== undefined;
        }
    };


// - skips empty elements
// - second argument is position
function each(a, f, j) {
    if (f === undefined || a === undefined) return;
    if (j === undefined) j = 0;
    if (is.array(a))
        for (var i = 0, l = a.length; i < l; i++, j++) each(a[i], f, j);
    else f(a, j);
}

function fin(f, o) {
    return (o[f] !== undefined) ? o[f] : (o[f] = {}, o[f]);
}

function _in(o) {
    return (o._ !== undefined) ? o._ : (o._ = {}, o._);
}


module.exports = {
    is: is,
    fin: fin,
    _in: _in,
    each: each
};


