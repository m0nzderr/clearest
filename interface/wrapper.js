/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Wrapper interface
 * @constructor
 */
function Wrapper(){}
/**
 * Returns wrapped view object (element)
 * @return view element
 */
Wrapper.prototype.get = function(){throw "not implemented"}

/**
 * Binds a handler to events
 * TODO: specify handler contract
 * @param events - event declaration string (could be multiple events)
 * @param handler - event handler function
 * @return irrelevant
 */
/* istanbul ignore next */
Wrapper.prototype.on=function(event, handler){throw "not implemented";}

/**
 * Unbinds a handler to events
 * @param events - event epecification
 * @param handler - event handler function
 * @return irrelevant
 */
/* istanbul ignore next */
Wrapper.prototype.off=function(event, handler){throw "not implemented";}
/**
 * Triggers specified event on wrapped element
 * @return irrelevant
 */
/* istanbul ignore next */
Wrapper.prototype.trigger=function(event, options){throw "not implemented";}

module.exports = Wrapper;
