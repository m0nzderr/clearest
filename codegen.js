/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */


function interpolate(string, o, defaultValue) {
    if (defaultValue === undefined)
        defaultValue = "";
    return string.replace(/\$([\w]*)/g,
        function (a, b) {
            var r = o[b];
            return r === undefined ? defaultValue : r;
        }
    );
}

function is(v) {
    return v !== undefined && (v.length > 0);
}


function call(o) {
    return interpolate(is(o.context) ?
        "($fn).call($context,$args)" :
        "$fn($args)", o);
}


function list(elements) {
    return elements.join(", ");
}

function array(elements) {
    return "[" + list(elements) + "]";
}


/* FIXME: use better contract */
function object(o, v) {

    if (typeof o !== 'string') {

        var s = "{";

        var isFirst = true;

        for (var k in o) {
            if (isFirst) {
                isFirst = false;
            }
            else {
                s += ", ";
            }

            if (k.length > 0 && k.charAt(0) == '@') {
                s += '"' + k + '":'
            }
            else {
                s += k + ':';
            }
            s += o[k];
        }

        s += "}";

        return s;
    }
    else {
        return interpolate((is(o) && is(v) ? "{$k:$v}" : "{}"), {k: o, v: v});
    }

}

function iff(o) {
    return interpolate("$cond?$then:$else", o, "undefined");
}

function closure(o) {
    return interpolate(
        (is(o.call) ? "(" : "")
        + "function ($args) {\n"
        + (is(o.strict) ? "\"use strict\"\n" : "")
        + (is(o.vars) ? "var $vars;\n" : "")
        + (is(o.body) ? "$body\n" : "")
        + (is(o.ret) ? "return $ret\n" : "")
        + "}"
        + (is(o.call) ? ")($call)" : "")
        , o);
}

function string(text, preserveSpaces) {
    return JSON.stringify(
        preserveSpaces ?
            text :
            text.replace(/^\s+|\s+$/g, " ")
                .replace("<", "&lt;")
                .replace(">", "&gt;")/**/);
}


module.exports = {
    call: call,
    object: object,
    iff: iff,
    list: list,
    array: array,
    closure: closure,
    string: string
};
