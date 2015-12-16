/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
'use strict'

var html = require("../core/html"),
    commons = require("../core/commons"),
    Builder = require("../interface/builder");

/**
 * Simplest builder implementation that wraps around browser implementation.
 *
 * @param document
 * @constructor
 */
commons.inherit(DomBuilder, Builder)

function DomBuilder(document, wrapper) {
    this.render = function (view, presentation) {
        // this is it
        view.innerHTML = html(presentation);
    };
    this.find = function (id) {
        return document.getElementById(id);
    }
    this.wrap = wrapper
}


module.exports = DomBuilder;


