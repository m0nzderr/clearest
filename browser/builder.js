/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var html = require("../runtime/html"),
    commons = require("../commons"),
    Builder = require("../runtime/builder");

/**
 * Simple builder that wraps around browser implementation.
 *
 * @param document
 * @constructor
 */
commons.inherit(DomBuilder, Builder)

function DomBuilder(document) {
    this.render = function (view, presentation) {
        // this is it
        view.innerHTML = html(presentation);
    };
    this.getView = function (id) {
        return document.getElementById(id);
    }

}


module.exports = DomBuilder;


