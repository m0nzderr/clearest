/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Application intrface
 * Abstraction layer between widget and a view renderer, e.g. browser DOM
 * @constructor
 */
/* istanbul ignore next */
function Application(){}
/**
 * Returns a view object for a component with given id.
 * A view object must have an id property
 * @param id
 * @param parentView is optional argument, may be used to improve performance
 */
/* istanbul ignore next */
Application.prototype.find=function(id, parentView){throw "not implemented";}

/**
 * Renderes a presentation object within a view
 * @param view
 * @param presentation
 */
/* istanbul ignore next */
Application.prototype.render=function(element, presentation){throw "not implemented";}

/**
 * Returns a wrapper to element, providing some additional functions
 */
/* istanbul ignore next */
Application.prototype.wrapper = function(element){throw "not implemented";}

/**
 * Process event chain
 */
/* istanbul ignore next */
Application.prototype.process = function(){throw "not implemented";}


/**
 * Binds a handler to events
 * TODO: specify handler contract
 * @param events - event declaration string (could be multiple events)
 * @param handler - event handler function
 * @return irrelevant
 */
/* istanbul ignore next */
Application.prototype.on=function(element, event, handler, options){throw "not implemented";}

/**
 * Unbinds a handler to events
 * @param events - event epecification
 * @param handler - event handler function
 * @return irrelevant
 */
/* istanbul ignore next */
Application.prototype.off=function(element, event, handler, options){throw "not implemented";}
/**
 * Triggers specified event on wrapped element
 * @return irrelevant
 */
/* istanbul ignore next */
Application.prototype.trigger=function(element, event, options){throw "not implemented";}

/**
 * Creates (custom) event
 * @return irrelevant
 */
/* istanbul ignore next */
Application.prototype.event=function(event, initializer){throw "not implemented";}

module.exports = Application;