/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Builder intrface
 * Abstraction layer between widget implementation and a view renderer, e.g. browser
 * @constructor
 */
/* istanbul ignore next */
function Builder(){}
/**
 * Returns a view object for a component with given id
 * @param id
 * @param parentView is optional argument, may be used to improve performance
 */
/* istanbul ignore next */
Builder.prototype.getView=function(id, parentView){throw "not implemented";}

/**
 * Renderes a presentation object within a view
 * @param view
 * @param presentation
 */
/* istanbul ignore next */
Builder.prototype.render=function(view, presentation){throw "not implemented";}


/**
 * Returns an id of a given view element
 * @param view
 * @param presentation
 */
/* istanbul ignore next */
Builder.prototype.getId=function(view){throw "not implemented";}

module.exports = Builder;