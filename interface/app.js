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
 * Returns a wrapper function
 */
Application.prototype.wrapper = function(element){throw "not implemented";}

/**
 * Process event chain
 */
Application.prototype.process = function(){throw "not implemented";}

module.exports = Application;