/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";
/**
 * Framework functions to be used in runtime by applications
 */

var commons = require("./core/commons"),
    observer = require("./core/observer");
module.exports = {
    constant: commons.constant,
    is : commons.is,
    promise: commons.promise,
    any: commons.any,
    each: commons.first,
    inherit: commons.inherit,
    error: commons.error,
    notify: observer.notify,
    send: observer.send,
    subscribe: observer.subscribe,
    unsubscribe: observer.unsubscribe,
    delay: commons.delay
};