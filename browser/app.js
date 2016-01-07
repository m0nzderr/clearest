/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
'use strict';

var html = require("../core/html"),
    commons = require("../core/commons"),
    promise = commons.promise,
    inside = commons.inside,
    runtime = require("../runtime"),
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

    // add window references (for debugging pruposes only)
    if (typeof window !== 'undefined') {
        window[commons.constant.CLEAREST] = {
            app: this,
            runtime: runtime
        }
    }
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
        if (attr === 'id') {
            //FIXME: create another logic to prevent ids from being removed
            continue;
        }
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
    return promise.resolve(this.root)
        .then(function (root) {
            return root.process()
        })
        .then(null, function (error) {
            if (error.stack)
                console.error("application error:", error.stack ? error.stack : error);
            throw error;
        });
};

//--- event handling ---//
BrowserApp.prototype.on = function (element, event, handler, options) {
    element.addEventListener(event, handler, options);
};

BrowserApp.prototype.off = function (element, event, handler, options) {
    element.removeEventListener(event, handler, options);
};

BrowserApp.prototype.event = function (event, initializer) {
    //TODO 2.1.0: add compatibility with older browsers
    return new CustomEvent(event, initializer);
}

BrowserApp.prototype.trigger = function (element, event) {
    if (typeof document !== 'undefined') {
        if (typeof event === 'string') {
            //FIXME: 2.1.0  remove deprecated code
            var e = document.createEvent("HTMLEvents");
            e.initEvent(event, true, true);
            element.dispatchEvent(e);
        }
        else {
            element.dispatchEvent(event);
        }
    }
};


module.exports = BrowserApp;


