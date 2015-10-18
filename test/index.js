/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

//TODO: test error handling
//TODO: test appender

var chai = require("chai"),
    clearest  = require("../index"),
    File = require("vinyl"),
    fs = require("fs"),
    streamify = require('stream-array');

var ftrue = function () {
    return true
}, ffalse = function () {
    return false
};


describe("#tool compiler",function(){

    it("should transform xml files into js",function(done){

        var stream = streamify([
            new File({
                cwd: "./",
                base: "./",
                path: "foo.xml",
                contents: new Buffer(fs.readFileSync("./test/fixtures/1/index.xml"),'utf8'),
                stat: {
                    isFile: ftrue,
                    isDirectory: ffalse,
                    isBlockDevice: ffalse,
                    isCharacterDevice: ffalse,
                    isSymbolicLink: ffalse,
                    isFIFO: ffalse,
                    isSocket: ffalse
                }
            })
        ]);

        stream.pipe(clearest.compiler()).on("data",function(file){
            file.path.should.be.exactly("foo.tpl.js");
            done();
        });

    });
});

describe("#tool renderer",function(){

    it("should transform compiled template modueles into .html",function(done){

        var stream = streamify([
            new File({
                cwd: "./",
                base: "./",
                path: "foo.tpl.js",
                contents: new Buffer(fs.readFileSync("./test/fixtures/1/index.tpl.js"),'utf8'),
                stat: {
                    isFile: ftrue,
                    isDirectory: ffalse,
                    isBlockDevice: ffalse,
                    isCharacterDevice: ffalse,
                    isSymbolicLink: ffalse,
                    isFIFO: ffalse,
                    isSocket: ffalse
                }
            })
        ]);

        stream.pipe(clearest.renderer({
            error:function(file,error){
                throw error;
            }
        })).on("data",function(file){
            file.path.should.be.exactly("foo.html");
            done();
        });

    });

});
