/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
'use strict'

var html = require("../core/html"),
    commons = require("../core/commons")
    //App = require("../interface/app");

/**
 * Simplest builder implementation that wraps around browser implementation.
 *
 * @param document
 * @constructor
 */
//commons.inherit(BrowserApp, App)

function BrowserApp(document, wrapper) {
    this.find = function (id) {
        return document.getElementById(id);
    };
    this.wrapper = wrapper;
    this.root = null;
    this.queue = null;
}

BrowserApp.prototype.render = function (view, presentation) {
    // this is it
    view.innerHTML = html(presentation);
};

BrowserApp.prototype.process = function(){
    if (this.root) {
        return this.root.process();
    }
};

module.exports = BrowserApp;


