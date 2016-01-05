/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";

var commons = require("./commons"),
    aggregator = require("./aggregator"),
    is = commons.is,
    isValue = is.value,
    isError = is.error,
    isArray = is.array,
    isFunction = is.fun,
    inside = commons.inside,
    isClearest= is._,
    isIncomplete = is.incomplete,
    complete = commons.complete,
    isPromise = is.promise,
    each = commons.each,
    promise = commons.promise;


var ID_ATTRIBUTE = commons.constant.ATTR + 'id',
    ID_SEPARATOR = '-',
    CLEAREST = commons.constant.CLEAREST,
    KEY_ANY = commons.constant.ANY;


/**
 * Basic Runtime API
 * This API implements core behavior of XVDL instructions
 */
function Core() {

    var self = this;
    var components = this.components = [];
    var counter = {}, widgetId;

     // generates unique id for a component
    function componentId(o, k) {
        var id = o[ID_ATTRIBUTE];

        if (!id) {
            // use widget id first
            if (!k) {
                id = widgetId;
            }else {
                // generete id on the fly
                if (counter[k] === undefined)
                    counter[k] = 0;
                id = (widgetId? (widgetId + ID_SEPARATOR):'') + k + (++counter[k]);
            }
            o[ID_ATTRIBUTE] = id;
        }
        return id;
    }
    // some common implementation parts

    // scans o for control code populating components, biding to events, etc.
    function _scan(o, prefix) {
        if (o === undefined
            || o === null
            || isValue(o)
            || isFunction(o)
        ) return; // skip

        self._listen(o, KEY_ANY, true);

        if (isClearest(o)) {
            var ctl = inside(o).ctl;
            if (ctl) {
                components.push({
                    id: componentId(o, prefix),
                    init: ctl
                })
            }
        }

        for (var k in o) {
            if (k !== CLEAREST && k) {
                each(o[k], function (o) {
                    _scan(o, k);
                })
            }
        }
    }

    this._scan=_scan;
    this._setId=function(id){ widgetId = id;}
    this._getId=function(id){ return widgetId;}
}


// --- functions to be implemented for dynamic behavior ---
/**
 * Is called by template to hook on o[k]
 * @param o
 * @param k
 * @private
 */
/* istanbul ignore next */
Core.prototype._listen = function (o, k, updateOnly) {}

/**
 * Is called by api on rejection.
 * object contains wrapped error
 */
/* istanbul ignore next */
Core.prototype._error = function (o) {}


/**
 * By default implementation, returns a control function with bound scope (curried)
 * @param {function} ctl
 * @param {array} scope
 */
/* istanbul ignore next */
Core.prototype.ctl = function(ctl, scope){
    return function(){
        return ctl.apply(this, scope);
    }
};

/**
 * Used to wrap depencency resolution for tracking/caching.
 * Default implementation does nothing.
 * @param {*} dependent object
 * @param {*} dependency object
 * @param {string} source
 */
/* istanbul ignore next */
Core.prototype.dep = function (dependent, dependency, source) {
    return dependency;
}

// --- core functions called by template code ---
/**
 * use(templateModule, contextObject)
 * The default behavior is to call a templateModule with arguments,
 * ensuring that context object is resolved.
 * @param templateModule compiled template (function exported from module)
 * @param o context object to run with
 */
Core.prototype.use = function (templateModule, o) {
    var api = this;
    return this.get(
        function (context) {
            return templateModule(api, api.agg, context);
        }, [o]);
};

/**
 * function sel(o, k, iteration, filter)
 *
 * Implements selection operator
 *
 * @param o - object
 * @param k - key/property
 * @param iteration - iteration template
 * @param filter - filtering options
 * @returns {*}
 */
Core.prototype.sel = function (o, k, iteration, filter) {
    if (o === undefined ||
        o === null ||
        isValue(o)
    ) return;

    this._listen(o, k);

    var item = o[k];
    if (item === undefined) {
        var api = this;
        return isIncomplete(o) ?
            // return completion promise
            complete(o).then(function (o) {
                return api.sel(o, k, iteration, filter);
            }) :
            undefined; // no element
    }

    if (iteration === undefined &&
        filter === undefined)
        return item; // return data as is

    if (!isArray(item))
        return iteration(item, 0); //TODO: add filtering

    // iterate over array
    var output = [];
    each(o[k], function (item, index) {
        //TODO: add filtering
        output.push(iteration(
            item, index
        ))
    });
    return output;
}

/**
 * cnt = function cnt(o, k)
 *
 * Provide count of items represented by the property
 *
 * @param o object
 * @param k property/key (string) or array of strings
 * @returns int count or array of counts
 */
Core.prototype.cnt = function (o, k) {
    if (!isArray(k)) {
        if (o === undefined ||
            o === null ||
            isValue(o))
            return 0; // undefined, null, or values are not containers

        this._listen(o, k); // subscribe for changes

        var item = o[k];

        if (item === undefined) {
            var api = this;
            return isIncomplete(o) ?
                // return a promise
                complete(o).then(function (o) {
                    return api.cnt(o, k);
                })
                :
                0;// count = 0
        }

        if (isArray(item)) {
            return item.length; // array length
        } else {
            return item ? 1 : 0; // return 1 when singletone resolves to true, 0 othewise
        }
    }
    else {
        var api = this;
        return k.map(function (k) {
            return api.cnt(o, k)
        });
    }
}


Core.prototype.get = function (target, args /*, resolveIncomplete*/) {
    var jobs = [], api = this;
    args.forEach(function (o, i) {
        if (isPromise(o)) {
            // enqueue promises
            jobs.push(
                o.then(function (o) {
                    // store resolved value
                    args[i] = o;
                }, function (error) {
                    var wrapped = commons.error(error);
                    // pass wrapped error through to the template
                    // store error inside api for further processing
                    api._error( args[i] = wrapped );
                })
            );
        }
    });

    if (jobs.length) {
        // there are promises need to be resolved
        var def = promise.defer();
        promise.all(jobs).finally(function () {
            // when arguments are ready (even with errors, template processing should not abort)
            promise.resolve(target) // ensure target is callable
                .then(function(target){
                    return target.apply(api, args); // call inside promise resolution, so it will reject on any failure
                }).then(def.resolve, def.reject);
        });
        return def.promise;
    }
    else {
        // just call target
        return target.apply(api, args);
    }
}

Core.prototype.agg = aggregator;

/**
 * Dependency injection/resolution mechanism (not a "require")
 * @param dependency
 */
Core.prototype.inj = function(dependency){
    if (dependency === undefined)
        return this;
    throw 'dependency not found: '+dependency;
}


/**
 * Implements error handling.
 *
 * @param object
 * @param opertaion   0 - probe, 1 - probe and catch
 * @param arguments   multiple arguments
 * Usage:
 * P.err(o, operation)  - returns error object itself or undefined, if no error
 * P.err(o, operation, {String} type) - additionaly checks the error type
 * P.err(o, operation, {String} type, function filter($error) { ...}) - applies filter to error, if exists
 *
 * @returns {*} error object os speficied type or undefined otherwise
 */
Core.prototype.err = function(o, docatch) {

    var filter, type;

    if (arguments.length > 2) {
        if (typeof arguments[2] === 'string') {
            type = arguments[2];
            if (arguments.length === 4) {
                filter = arguments[3]
            }
        } else {
            filter = arguments[2]
        }
    }

    if (o && !isValue(o) && !isArray(o)) {
        //FIXME: move to another layer
        this._listen(o, CLEAREST +".error"); // subscribe for changes on '__clearest__.error' key
    }

    if (!isError(o, type))
        return;

    var error = inside(o).error;

    if (docatch)
        delete inside(o).error;

    return filter ? filter(error) : error;

}

module.exports = Core;