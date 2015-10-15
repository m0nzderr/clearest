/*!
 * Clearest Framework
 * Provided under MIT License.
 * Copyright 2012-2015, Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Static renderer
 * @constructor
 */
var aggregator = require("./runtime/aggregator.js"),
    html = require("./runtime/html.js"),
    extend = require("extend");

function StaticAPI(streamAppender) {
    //TODO: implement api

}

function Renderer(userConfig) {

    var config = {
        doctype: '<!DOCTYPE html>\r\n'
    };

    (this.configure = function (userConfig) {
        if (userConfig === undefined)
            return config;
        extend(true, config, userConfig);
        return config;
    })(userConfig || {});


    this.render = function (context, templateModule, streamAppender) {

        var output = templateModule(
            context,
            new StaticAPI(streamAppender),
            aggregator);

        return config.doctype + html(output);
    }


}


module.exports = Renderer;