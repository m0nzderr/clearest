/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
'use strict'

var html = require("../core/html"),
    commons = require("../core/commons"),
    inside = commons.inside,
    isClearest = commons.is._;
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


function scanAtrributes(el, fun) {
    var attrs = el.attributes;
    if (attrs) {
        for (var i = 0, n = attrs.length; i < n; i++) {
            fun(attrs)
        }
    }
}

BrowserApp.prototype.render = function (view, presentation) {

    var attrs = {}, fresh = false;
    // catpure external attributes once
    if (!isClearest(view) || !inside(view).attrs) {
        scanAtrributes(view, function (attr) {
            attrs[attr.nodeName] = attr.nodeValue;
        })
        inside(view).attrs = attrs;
        fresh = true;
    } else {
        attrs = inside(view).attrs;
    }

    if (!isValue(presentation)) {

        // remove inexisting attributes:
        if (!fresh) {
            scanAtrributes(view, function (attr) {
                if (attrs[attr.nodeName] === undefined // not external
                    && presentation[KEY_ATTR + attr.nodeName] // nor internal
                ) {
                    // drop it
                    view.removeAttributeNode(attr);
                }
            })
        }

        // update new attributes
        for (var key in presentation) {
            if (key.charAt(0) === KEY_ATTR) {
                view.setAttribute(key.slice(1), presentation[key]);
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

module.exports = BrowserApp;


