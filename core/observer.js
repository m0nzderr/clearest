/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
var commons = require("./commons"),
    inside = commons.inside,
    isValue = commons.is.value;
    promise = commons.promise;

/**
 * Subscribes an observer on event key (k) of object (o).
 * Event key commons.constant.ANY means any event of object o.
 *
 * @param o object
 * @param k event key (string),
 * @param observer = function(o, k, eventData)
 * @returns {boolean} true: if observer subscribed, false: if observer already subscribed to that object, and undefined if subscription were not possible
 */
var NULL_VALUE = null, ANY = commons.constant.ANY;
function subscribe(o, k, observer) {
    // ensure the object is not null or value type
    if (o === undefined ||
        o === null ||
        isValue(o))
        return;

    var h_ = inside(observer),
        o_ = inside(o),   // get clearest objects inside handler and o
        obs = h_.obs = h_.obs || [], // list observables
        sub = o_.sub = o_.sub || {}; // subscribers by key

    k = k || ANY;

    var subk = sub[k],
        exist = false,
        index = -1;

    if (!subk && !sub[ANY]) {
        // new subscriber
        sub[k] = [observer];
        index = 0;
    }
    else {
        // subscriber exists
        if (sub[ANY]) { // first, check if there is already ANY subscription
            index = sub[ANY].indexOf(observer);
            if (index >= 0) {
                exist = true;
                k = ANY; // switch to ANY record
            }
        }
        if (!exist) {
            // check for subk
            /*if (!subk) {
             // new key
             sub[k] = [observer];
             index = 0;
             }
             else {*/
            index = subk.indexOf(observer);
            if (index < 0) {
                // try to reuse memory
                index = subk.indexOf(NULL_VALUE);
                if (index < 0)
                    index = subk.push(observer) - 1;  // new element
                else
                    subk[index] = observer;  // reused index
            }
            else
                exist = true;    // subscription already exists
            //}
        }
    }

    // create new record in observer if needed
    if (!exist) {
        obs.push({
            k: k,
            o: o,
            idx: index
        });
        return true;
    }
    else
        return false;
}


/**
 * Removes observer from all observable objects
 * @param observer
 */
function unsubscribe(observer) {
    if (!observer || !observer.__clearest__)
        return; //nothing to do, not an observe
    var obs = observer.__clearest__.obs;
    if (obs === undefined)
        return;
    obs.forEach(
        function (record) {
            // clean up references
            record.o.__clearest__.sub[record.k][record.idx] = NULL_VALUE;
        });
    // drop reference to observables
    delete observer.__clearest__.obs;
}

/**
 * Notifies all observers of object (o) with event (k) and event data (eventData)
 *
 * @param o observable object
 * @param k event key string or (commons.constant.ANY)
 * @param event data argument passed to observer
 * @returns {*} count of notifications sent or false
 */
function notify(o, k, event) {
    var count = 0;
    if (o === undefined ||
        o === null || o.__clearest__ === undefined)
        return false; //cannot have subscribers

    var sub = o.__clearest__.sub;

    if (!sub) return false;

    function _notifyInternal(subscribers, exclude) {
        var count = 0;
        if (subscribers !== undefined) {
            subscribers.forEach(function (handler) {
                // call observer
                if (handler === NULL_VALUE ||
                    (exclude !== undefined && exclude.indexOf(handler) >= 0))
                    return; // skip

                handler(event, o, k);
                count++;
            });
        }
        return count;
    }

    var anyKeySubscribers = sub[ANY];

    //first, notify subscribers for ANY key
    if (anyKeySubscribers) {
        count += _notifyInternal(anyKeySubscribers);
    }


    if (k !== ANY) {
        // notify subscribers for key k != ANY
        count += _notifyInternal(sub[k], anyKeySubscribers);
    }
    else {
        // k == ANY: notify everyone esle, except anyKeySubscribers (thet were already notified)
        for (var k in sub) {
            count += _notifyInternal(sub[k], anyKeySubscribers);
        }
    }

    return count;
}

/**
 * Sugar function that does two things:
 *
 *  1) assigns fields of (o) to corresponing key/values
 *  2) notifies o with the corresponding events and data
 *
 *  Foe example:
 *
 *  send(o, {foo:42,bar:true})
 *
 *  is equivalent to
 *
 *  o.foo = 42; notify(o,'foo',42);
 *  o.bar = true; notify(o,'bar',true);
 *
 *  send(o, {foo:42,bar:true}, 'changed')
 *
 *  is equivalent to
 *    o.foo = 42; notify(o,'foo','changed');
 *    o.bar = true; notify(o,'bar','changed');
 *
 * @param o
 * @param values
 * @param data optional data argument
 */
function send(o, values, data) {
    for (var k in values) {
        var v = o[k] = values[k];
        notify(o, k, data === undefined ? v : data);
    }
}

module.exports = {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    notify: notify,
    send: send
}
