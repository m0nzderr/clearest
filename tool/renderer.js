/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Static renderer
 * @constructor
 */
var aggregator = require("./../runtime/aggregator.js"),
    commons = require("../commons"),
    html = require("./../runtime/html.js"),
    Api = require("./../runtime/api.js"),
    extend = require("extend");

function Renderer(userConfig) {

    var config = {
        doctype: '<!DOCTYPE html>\n'
    };

    (this.configure = function (userConfig) {
        if (userConfig === undefined)
            return config;
        extend(true, config, userConfig);
        return config;
    })(userConfig || {});

    this.render = function (context, templateModule, streamAppender) {
        var output = templateModule(
            new Api(streamAppender),
            aggregator,
            context);
        return config.doctype + html(output);
    }

}


module.exports = Renderer;