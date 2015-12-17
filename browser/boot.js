/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * This is default "boot" configurtaion which defines the "basis" of the framework
 * (and your application as well)
 *
 */

/**
 * Commons library, widget/api and dom abstraction layer implementations.
 * Usually, I would'nt touch those:
 */
//var commons = require("../core/commons");
var Widget = require("./widget");
var Builder =require("./app");

/**
 * Element wrapper implementation
 * The default one is 'basic' it implements some abstraction for event handling (on, off),
 * css manipulation
 */
var $ =require("./basic"); // default
//var $ =require("sl8"); // for future releases
//var $ =require("jquery"); // yes, you could use jquery here

/* instanbul ingnore next */
module.exports = new Widget(new Builder(document, $));
