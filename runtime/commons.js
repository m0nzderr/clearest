/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var constant ={
   CLEAREST: '__clearest__',
   ATTR: '@',
   TEXT: '$'
};

var is_ = function (o) {
        return o ? o.__clearest__ !== undefined : false;
    },
    is = {
        _: is_,
        array: Array.isArray || function (a) {
            return a instanceof Array;
        },
        fun: function (o) {
            //FIXME: ensure compatibility with old browsers
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
            return is_(o) && o.__clearest__.seq !== undefined;
        },
        incomplete: function (o) {
            return is_(o) && o.__clearest__.complete !== undefined;
        },
        error: function (o) {
            return is_(o) && o.__clearest__.error !== undefined;
        }
    },
    CLEAREST = '__clearest__';


/**
 * each(a, f, [ j ])
 *
 * Recursive array iterator
 *
 * @param a array
 * @param f iterator function(element, [ position ])
 * @param j starting index
 */
function each(a, f, j) {
    if (f === undefined || a === undefined) return;
    if (j === undefined) j = 0;
    if (is.array(a))
        for (var i = 0, l = a.length; i < l; i++, j++)
            each(a[i], f, j);
    else f(a, j);
}

/**
 * Ensures that there is an object field f in o
 *
 * @param f field
 * @param o object
 * @returns field content or new object
 */
function fin(f, o) {
    return (o[f] !== undefined) ? o[f] : (o[f] = {});
}

/**
 * Same thing as fin(constant.CLEAREST,o),
 * but about twice as faster
 *
 * @param o
 * @returns {*}
 * @private
 */

function _in(o) {
    return (o.__clearest__ !== undefined) ? o.__clearest__ : (o.__clearest__ = {});
}


module.exports = {
    is: is,
    fin: fin,
    _in: _in,
    each: each,
    constant:constant
};


