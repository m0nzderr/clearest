/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Api intrface
 * (documentation purpose only)
 */
/* istanbul ignore next */
function Api(){}

function notImplemented(){return throw "Not implemented"}

Api.prototype.obs = function (o, k, handler) {/* istanbul ignore next */  notImplemented()}

/**
 * Supposed to return a controller that handles view events
 * @param o
 * @param k
 * @param handler
 */
/* istanbul ignore next */
Api.prototype.on = function (event, handler) {/* istanbul ignore next */  notImplemented()}

/**
 * Instantiates a widget
 * @param {function} template
 */
/* istanbul ignore next */
Api.prototype.wid = function (templateFunction, context) {/* istanbul ignore next */  notImplemented()}

/**
 * Returns a control function with bound scope
 * @param {function} ctl
 * @param {array} scope
 */
/* istanbul ignore next */
Api.prototype.ctl = function(ctl, scope) {/* istanbul ignore next */  notImplemented()}

/**
 * Used to wrap depencency resolution for tracking/caching.
 * @param {*} dependent object
 * @param {*} dependency object
 * @param {string} source
 */
/* istanbul ignore next */
Api.prototype.dep = function (dependent, dependency, source)  {/* istanbul ignore next */  notImplemented()}

// --- core functions called by template code ---
/**
 * use(templateModule, contextObject)
 * The default behavior is to call a templateModule with arguments,
 * ensuring that context object is resolved.
 * @param templateModule compiled template (function exported from module)
 * @param o context object to run with
 */
Api.prototype.use = function (templateModule, o) {/* istanbul ignore next */  notImplemented()}

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
Api.prototype.sel = function (o, k, iteration, filter) {/* istanbul ignore next */  notImplemented()}

/**
 * cnt = function cnt(o, k)
 *
 * Provide count of items stored in the property
 *
 * @param o object
 * @param k property/key (string) or array of strings
 * @returns int count or array of counts
 */
Api.prototype.cnt = function (o, k) {/* istanbul ignore next */  notImplemented()}

Api.prototype.get = function (target, args /*, resolveIncomplete*/) {/* istanbul ignore next */  notImplemented()}

Api.prototype.agg = function() {/* istanbul ignore next */  notImplemented()}

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
Api.prototype.err = function(object, opertaion, arguments) {/* istanbul ignore next */  notImplemented()}

/**
 * 2.1.0
 * Dependency injection/resolution mechanism (not a "require")
 * @param dependency
 */
Api.prototype.inj = function(dependency) {/* istanbul ignore next */  notImplemented()}

module.exports = Api;