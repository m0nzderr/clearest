/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 * Static renderer
 * @constructor
 */
var aggregator = require("./runtime/aggregator.js"),
    commons = require("./runtime/commons.js"),
    html = require("./runtime/html.js"),
    extend = require("extend");

function StaticAPI(streamAppender) {

    this.use = function (templateModule, context) {
        return templateModule(context, this, aggregator);
    }

    this.sel = function(context, element, iteration){

        if (context === undefined ||
            context === null ||
            commons.is.value(context)
        ) return;

        var data = context[element];

        if (data === undefined || data === null)
            return;

        // no iteration
        if (iteration === undefined)
            return data;

        // singletone
        if (!commons.is.array(data))
            return iteration(data,0);

        // array
        var output = [];
        commons.each(context[element],function(item, index){
            output.push(iteration(
                item, index
            ))
        });
        return output;
    }



    this.cnt = function cnt(context, elements){

        if (typeof elements === 'string') {
            var o = context[elements];

            if (o === undefined || o === null)
              return 0;

            if (commons.is.array(o))
                return o.length;

            return 1;
        }
        else {
            var output =[];
            commons.each(elements,function(element){
                output.push(cnt(context, element));
            });
            return output;
        }
    }

    this.get = function get(target, arguments ){
        return target.apply(this,arguments );
    }

}

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
            context,
            new StaticAPI(streamAppender),
            aggregator);
        return config.doctype + html(output);
    }

}


module.exports = Renderer;