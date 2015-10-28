/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
var commons = require("../commons");
var Widget = require("../runtime/widget");
var DomBuilder =require("./builder");
module.exports = new Widget(new DomBuilder(document));
