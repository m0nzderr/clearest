/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";

// imports
var commons = require("./commons.js"),
    isArray = commons.is.array,
    isFunction = commons.is.fun,
    isValue = commons.is.value,
    each = commons.each,
    isComposit = commons.is.composit;

var COMMENT = commons.constant.COMMENT,
    ATTRIBUTE_PREFIX = commons.constant.ATTRIBUTE_PREFIX,
    TEXT_NODE = commons.constant.TEXT_NODE,
    CLEAREST = commons.constant.CLEAREST,
    VOID_TAG_LIST = [
        "area",
        "base",
        "br",
        "col",
        "command",
        "embed",
        "hr",
        "img",
        "input",
        "keygen",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    ],
    IS_VOID_TAG = {};

// build IS_VOID_TAG lookup table
VOID_TAG_LIST.forEach(function (tag) {
    IS_VOID_TAG[tag] = IS_VOID_TAG[tag.toUpperCase()] = true;
});

// exports
module.exports = html;

/*

 input:
 - values
 - composits
 - plain objects

 */

function html(o, tag) {

    var head, body, buf = '';

    if (o === undefined || o === null) {
        return buf;
    }

    if (tag !== undefined && tag !== TEXT_NODE) {
        if (tag === COMMENT) {
            head = '<!-- ';
        } else {
            head = '<' + tag;
        }
    }

    if (isValue(o)) {
        if (typeof o === 'string') {
            body = o.replace(/</g, '&lt;');
        }
        else {
            body = o;
        }
    }
    else if (isFunction(o)) {
        body = o();
    }
    else {
        var composit = isComposit(o), att;

        if (!composit || head !== undefined) { // no need to a composit objet without head
            for (var k in o) {
                var text = (k === TEXT_NODE);
                var att = !text && (k.charAt(0) === ATTRIBUTE_PREFIX);
                if (k !== CLEAREST && (att || !composit)) { // omit clearest data and composit properties
                    var ok = o[k];
                    if (ok !== undefined && ok !== null) { // omit null data
                        if (!att) { // data property
                            if (body === undefined) {
                                body = ''; // ensure body is initialized
                            }
                            // render property
                            each(ok, function (el) {
                                body += html(el, k);
                            });
                        }
                        else if (head !== undefined) { // render attribute
                            head += ' ' + k.substring(1) + '="';
                            each(ok, function (el) {
                                head += html(el).replace(/"/g, '&quot;')
                            });
                            head += '"';
                        }
                    }
                }
            }
        }

        if (composit) {
            // render composit sequence
            if (o.__clearest__.seq.length) {
                if (body === undefined) {
                    // ensure body is initialized
                    body = '';
                }

                each(o.__clearest__.seq, function (el) {
                    body += html(el);
                })
            }
        }
    }

    // close tags

    if (head !== undefined) {
        if (tag !== COMMENT) {
            if (body !== undefined) {
                head += '>';
                body += '</' + tag + '>';
            }
            else {
                if (IS_VOID_TAG[tag] !== undefined) {
                    head += '/>';
                } else
                    head += '></' + tag + '>';
            }
        }
        else {
            if (body !== undefined) {
                body += ' -->';
            }
            else head += ' -->';
        }
    }

    // assembly output

    if (head !== undefined) {
        buf += head;
    }
    if (body !== undefined) {
        buf += body;
    }

    return buf;
}


