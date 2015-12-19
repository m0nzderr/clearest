/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
'use strict'

var html = require("../core/html"),
    commons = require("../core/commons"),
    inside = commons.inside,
    isClearest = commons.is._,
    isValue = commons.is.value;

//App = require("../interface/app");

var KEY_ATTR = commons.constant.ATTR;

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


/*function scanAtrributes(el, fun) {
 var attrs = el.attributes;
 if (attrs) {
 for (var i = 0, n = attrs.length; i < n; i++) {
 fun(attrs[i])
 }
 }
 }*/

BrowserApp.prototype.render = function (view, presentation) {

    var localAttributes = {};//, fresh = false;

    // initialize
    if (!isClearest(view) || !inside(view).attrs) {
        inside(view).attrs = localAttributes;
    } else {
        localAttributes = inside(view).attrs;
    }

    var plain = isValue(presentation);

    // remove old attributes
    for (var attr in localAttributes) {
        var key = KEY_ATTR + attr;
        if (plain || presentation[key] === undefined || presentation[key] === null) {
            view.removeAttribute(attr);
        }
    }

    if (!plain) {
        // add new attributes
        for (var key in presentation) {
            if (key.charAt(0) === KEY_ATTR) {
                var attr = key.slice(1);
                view.setAttribute(attr, presentation[key]);
                localAttributes[attr] = true;
            }
        }
    }

    // render body
    view.innerHTML = html(presentation);
};

BrowserApp.prototype.process = function () {
    if (this.root) {
        return this.root.process();
    }
};

//--- event handling ---//
BrowserApp.prototype.on = function(element, event, handler, options) {
    element.addEventListener(event, handler, options );
};

BrowserApp.prototype.off = function(element, event, handler, options){
    element.removeEventListener(event, handler, options );
};

BrowserApp.prototype.trigger = function(element, event, options){
//TODO: deal with custom events
    if (typeof document !== 'undefined'){
        //var e = new Event(event, options) - fails in PhantomJS
        //var e = document.createEvent(event, options);
        var e = document.createEvent("HTMLEvents");
        e.initEvent(event, true, true);
        element.dispatchEvent(e);
    }
};



module.exports = BrowserApp;


