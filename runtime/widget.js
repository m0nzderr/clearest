/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var Api = require("./api"),
    inherit = require("./../commons/inherit");

inherit(Widget, Api);

/**
 *
 * @param params:{
 *      template: template function
 *      context: context object
 *      settings: implementation specific options
 *      parameters: widget parameters, avaibale from the scope
 * }
 * @constructor
 */
function Widget(params){

}


module.exports= Widget;