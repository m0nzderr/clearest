/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";
/**
 * Aggregator (ported from Clearest 1.0)

 a<foo>bar1</foo>c + d<foo>bar2</foo>f = a<foo>bar1</foo>cd<foo>bar2</foo>f
 {----- el1 -----}   {----- el2 -----} =

 {
   _:{_seq:[el1,el2] - argument sequence is preserved}

   foo:[bar1,bar2]
   $:[a,c,d,f]
 }

 output:

 - value,
 - composit
 - promise

 inputs:

 - items (or arrays of)
 - empty elements (null/undefined)
 - arrays
 - values
 - plain objects
 - composits
 - promises
 - objects with promise properties
 - functions

 rules:

 1) all deferreds are processed after their resolution (up to the first property level
 2) singletones are intact
 3) non-singletones become composits:
 isComposit(agg(x,y))
 4) values are accumulated in '$' key
 5) controller functions are gathered in .ctl array
 */


//TODO: refactor, optimize

// imports
var commons = require("./commons"),
    promise = commons.promise,
    is = commons.is,
    is_ = is._,
    isValue = is.value,
    isArray = is.array,
    isComposit = is.composit,
    isPromise = is.promise,
    isIncomplete = is.incomplete,
    isFun = is.fun,
    each = commons.each,
    in_ = commons.inside;

var TEXT = commons.constant.TEXT,
    ATTR = commons.constant.ATTR,
    CLEAREST = commons.constant.CLEAREST;

//exports
module.exports = agg;

// builds a composit object
// TODO: review summation logic for attributes (concat strings instead of push)?
function compose(seq) // sequence is a plain array
{
    var o = {}, // generate result object
        o_ = in_(o); // get clearest inside

    o_.seq = seq; // store sequence

    function _put(k, v) {

        if (v === undefined || v === null) {
            return;
        }

        var ok = o[k];

        if (ok === undefined || ok === null) {
            o[k] = v;
        }
        else {
            if (!isArray(ok)) {
                ok = o[k] = [ok];
            }
            // collect arrays by reference
            ok.push(v);
        }
    }

    // compose properties
    for (var i = 0; i < seq.length; i++) {
        var el = seq[i];

        if (el !== undefined && el !== null)
            if (isValue(el))
                _put(TEXT, el);
            else
                for (var k in el)
                    if (k !== CLEAREST)
                        _put(k, el[k]);
    }

    return o;
}


function agg() {

// pre-scan step:
    var seq = [], j = [], ctl = (this !== undefined) ? (this.ctl || []) : [];

    for (var i = 0, l = arguments.length; i < l; i++)
        each(arguments[i], function (el) {
            // pick-up and relocate controllers:
            if (is_(el)) {
                var el_ = in_(el);
                if (el_.ctl) {
                    ctl.push(el_.ctl);
                    delete el_.ctl;
                }
            }

            if (el === null)
                return; // skip nulls
            else if (isValue(el) || isComposit(el))
                seq.push(el); // compsit or values go thru
            else if (isPromise(el) || isIncomplete(el)) {
                if (isIncomplete(el)) el = el.__clearest__.complete();

                // ensure deferred arguments are resolved
                j.push(
                    (function (pos) {
                        return el.then(function (res) {
                            seq[pos] = res;
                        })
                    })(seq.push(null) - 1)
                );
            }
            else if (isFun(el))
                ctl.push(el); // keep functions in ctl
            else // plain objects
            {
                for (var k in el)
                    // ensure deferred properties are resolved
                    if (isPromise(el[k]))
                        j.push((function (k, el) {
                            return el[k].then(function (v) {
                                el[k] = v;
                            })
                        })(k, el));

                seq.push(el);
            }
        });


    if (j.length) // if there are deferred jobs, aggregate sequence after resolution
    {
        return promise.all(j).then(function(){
            return agg.call({ctl: ctl}, seq);
        })
    }
    else {
        if (!seq.length && !ctl.length) return; // return, nothing to do

        // 1) all resolved singletones are bypassed
        var res;

        if (!seq.length)  // nothing but controller
            res = {};
        else if (seq.length == 1) // singletone
        {
            if (seq[0] !== undefined && seq[0] !== null)
                res = seq[0];
            else
                res = {};
        }
        else    // 2) multiple objects become a composition:
            res = compose(seq);

        // attach controllers	
        if (ctl.length) {
            if (isValue(res)) {
                res = {$: res}; //same as res = {}; res[TEXT]=res, but faster
            }

            var _o = in_(res);

            if (_o.ctl === undefined) {
                _o.ctl = ctl;
            }
            else {
                _o.ctl.push(ctl);
            }
        }

        return res;
    }
}

agg.compose = compose;


