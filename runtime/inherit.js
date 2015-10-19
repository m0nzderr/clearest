/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Ridiculously simple inheritance pattern (similar to the one used by closure library)
 *
 * Usage:
 *
 * function Foo(){
 *  // constructor of Foo
 * }
 *
 * Foo.prototype.a=function(){...} // method A of Foo
 * Foo.prototype.b=function(){...} // method B of Foo
 *
 * inherit(Bar,Foo) // inherits prototype of Foo
 * // providing a sugar Bar.super, such that:
 * // Bar.super()                  - returns a Foo.prototype
 * // Bar.super(this,[arguments])  - equivalent to Foo.apply(this,[arguments])
 *
 * function Bar(){ // constructor of Bar
 *  ...
 *  Bar.super(this,[arguments]); // calls base class constructor with some arguments
 *  ...
 * }
 *
 * Bar.prototype.a = function(){ // overrides method A
 *   var superA = Bar.super().a.bind(this);
 *     superA(...) // calls original method a
 * }
 *
 * @type {exports|module.exports}
 */
function slice(args, n) {
    var arr = [];
    for (var i = n, l = args.length; i < l; i++)
        arr.push(args[i]);
    return arr;
}

inherit = function (childClass, baseClass) {
    childClass.prototype = Object.create(baseClass.prototype);
    childClass.prototype.constructor = childClass;
    childClass.super = function (instance) {
        return (instance === undefined) ?
            baseClass.prototype :
            baseClass.apply(instance, slice(arguments, 1));
    };
};

module.exports = inherit;