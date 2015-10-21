/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

//TODO: test error handling
//TODO: test appender

var chai = require("chai"),
    streamTool  = require("../tool/stream"),
    File = require("vinyl"),
    fs = require("fs"),
    path = require("path"),
    streamify = require('stream-array');

var ftrue = function () {
    return true
}, ffalse = function () {
    return false
};


describe("tool / compiling pipe",function(){

    it("should transform xml files into js",function(done){

        var fixture = "./test/fixtures/2/index";

        var stream = streamify([
            new File({
                cwd: "./",
                base: path.dirname(path.resolve(fixture)),
                path: path.resolve(fixture+".xml"),
                contents: new Buffer(fs.readFileSync(path.resolve(fixture+".xml")),'utf8'),
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

        stream.pipe(streamTool.compiler()).on("data",function(file){
            file.path.should.be.exactly(path.resolve(path.resolve(fixture+".tpl.js")));
            done();
        });

    });
});

describe("tool / rendering pipe",function(){

    var fixture = "./test/fixtures/2/index";

    it("should compile and render .html on the fly",function(done){

        var stream = streamify([
            new File({
                cwd: "./",
                base: path.dirname(path.resolve(fixture)),
                path: path.resolve(fixture+".xml"),
                contents: new Buffer(fs.readFileSync(path.resolve(fixture+".xml")),'utf8'),
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

        stream.pipe(streamTool.compiler())
              .pipe(streamTool.renderer({
                useRequire:false,
                useInterpreter:true, // force using of interpreter
            error:function(file,error){
                throw error;
            }
        })).on("data",function(file){
            file.path.should.be.exactly(path.resolve(fixture+".html"));
            done();
        });
    });

    it("should render .html by require()'ing compiled modules directly ",function(done){

        var stream = streamify([
            new File({
                cwd: "./",
                base: path.dirname(path.resolve(fixture)),
                path: path.resolve(fixture+".xml"),
                contents: new Buffer(fs.readFileSync(path.resolve(fixture+".xml")),'utf8'),
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

        stream.pipe(streamTool.compiler())
            .pipe(streamTool.renderer({
                useRequire:true,
                useInterpreter:false,
                error:function(file,error){
                    throw error;
                }
            })).on("data",function(file){
                file.path.should.be.exactly(path.resolve(fixture+".html"));
                done();
            });

    });

});
