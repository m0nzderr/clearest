/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var commons = require("./../commons"),
    aggregator = require("./aggregator")
    is = commons.is,
    isValue = is.value,
    isArray = is.array,
    isIncomplete = is.incomplete,
    isPromise = is.promise,
    each = commons.each,
    promise = commons.promise,
    CLEAREST = commons.constant.CLEAREST;

/**
 * Basic Runtime API
 * This API implements core behavior of XVDL instructions
 */
function Api() {}

// --- functions to be implemented for dynamic behavior ---
/**
 * Is called by template to hook on o[k]
 * @param o
 * @param k
 * @private
 */
/* istanbul ignore next */
Api.prototype._listen = function (o, k) {
}
/**
 * Returns completion promise for object o
 * @param o
 * @private
 */
/* istanbul ignore next */
Api.prototype._promiseComplete = function (o) {
}

/**
 * Supposed to return a controller that observes o[k]
 * @param o
 * @param k
 * @param handler
 */
/* istanbul ignore next */
Api.prototype.obs = function (o, k, handler) {/* istanbul ignore next */ return abstract();}

/**
 * Supposed to return a controller that handles view events
 * @param o
 * @param k
 * @param handler
 */
/* istanbul ignore next */
Api.prototype.on = function (event, handler) {/* istanbul ignore next */ return abstract();}

/**
 * Supposed to return a controller that creates a widget
 * @param template
 * @param context
  */
/* istanbul ignore next */
Api.prototype.wid = function (template, context) {/* istanbul ignore next */ return abstract();}


// --- core functions called by template code ---
/**
 * use(templateModule, contextObject)
 * The default behavior is to call a templateModule with arguments,
 * ensuring that context object is resolved.
 * @param templateModule compiled template (function exported from module)
 * @param o context object to run with
 */
Api.prototype.use = function (templateModule, o) {
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
//TODO: implement filtering
Api.prototype.sel = function (o, k, iteration, filter) {
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
            this._promiseComplete(o).then(function (o) {
                return api.sel(o, j, iteration, filter);
            }) :
            undefined; // no element
    }

    if (iteration === undefined &&
        filter === undefined)
        return item; // return data as is

    if (!isArray(item))
        return iteration(item, 0); //TODO: implement filtering logic

    // iterate over array
    var output = [];
    each(o[k], function (item, index) {
        //TODO: implement filtering logic
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
Api.prototype.cnt = function (o, k) {
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
                this._promiseComplete(o).then(function (o) {
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

//TODO: vetify if resolveIncomplete is needed, probably not
Api.prototype.get = function (target, args /*, resolveIncomplete*/) {

    var jobs = [], api = this;

    args.forEach(function (o, i) {
        /*if (resolveIncomplete){
         if (isIncomplete(o)) {
         // trigger completion and substitute incomplete object by its promise
         o = o[CLEAREST].complete();
         }
         }*/
        if (isPromise(o)) {
            // enqueue promises
            jobs.push(
                o.then(function (o) {
                    // store resolved value
                    args[i] = o;
                }, function (error) {
                    // pass wrapped error through
                    args[i] = commons.error(error);
                    //TODO: check if error must be reported somewhere at this point, as it was done in Clearest 1.0
                })
            );
        }
    });

    if (jobs.length) {
        // there are promises need to be resolved
        var def = promise.defer();
        promise.all(jobs).finally(function () {
            // call when arguments are ready
            //TODO: decide, which context object (this) should be passed to target
            def.resolve(target.apply(api, args));
        });
        return def.promise;
    }
    else {
        // just call it
        //TODO: decide, which context object (this) should be passed to target
        return target.apply(api, args);
    }
}


Api.prototype.agg = aggregator;

module.exports = Api;