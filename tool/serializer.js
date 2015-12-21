/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var codegen = require("./codegen"),
    commons = require("../core/commons");

var CLEAREST = commons.constant.CLEAREST;

/**
 * Extremely naive serializer impl.
 * @constructor
 */
function Serializer() {
    //TODO: preserve references to same objects
    var self = this, vars = [], deps = {}, depCount = 0;
    this.serialize = serialize;
    this.vars = vars;

    function serialize(o) {

        //TODO: use references to objects

        if (isArray(o))
            return o.map(serialize);

        if (o === undefined)
            return "undefined";
        if (o === null)
            return "null";
        if (typeof o === 'string')
            return codegen.string(o, true);
        if (isClearest(o)) {
            if (inside(o).serialize) {
                return inside(o).serialize(self);
            }
        }
        if (isValue(o) || isFunction(o))
            return o.toString();

        var so = {};
        for (var k in o) {
            //FIXME: check for recursion
            if (k !== CLEAREST)
                so[k] = serialize(o[k]);
        }

        return codegen.object(so);
    }

    this.require = function (path) {
        if (deps[path])
            return deps[path];
        var varName = deps[path] = "$dep$" + (++depCount);
        //TODO: remove hardcoded "require"
        vars.push(varName + " = " + codegen.call({fn: "require", args: codegen.string(path)}));
        return varName;
    }

};

module.exports = Serializer;