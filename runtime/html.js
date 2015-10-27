/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
// imports
var commons = require("./../commons.js"),
    isArray = commons.is.array,
    isFunction = commons.is.fun,
    isValue = commons.is.value,
    each = commons.each,
    isComposit = commons.is.composit;

var TEXT = commons.constant.TEXT,
    COMMENT = commons.constant.COMMENT,
    ATTR = commons.constant.ATTR,
    CLEAREST = commons.constant.CLEAREST;

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
        return buf; //FIXME: determine what todo with empty elements
    }

    if (tag !== undefined && tag !== TEXT) {
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
            for (var k in o)
                if (k !== CLEAREST && ((att = (k.charAt(0) === ATTR)) || !composit)) { // omit clearest data and composit properties
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
            else head += '/>';
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


