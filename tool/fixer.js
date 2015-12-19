/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

var path = require("path"),
    sepFixerRe = new RegExp('\\' + path.sep, 'g'),
    sepNormalizerRe = /\//g;

module.exports={
    toPosix:function(s){
        return s.replace(sepFixerRe, "/")
    },
    fromPosix:function(s){
        return s.replace(sepNormalizerRe, path.sep);
    }
}