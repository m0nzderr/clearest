/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict";


var chai = require("chai"),
    expect = chai.expect,
    streamTool = require("../../tool/stream"),
    commons = require("../../core/commons"),
    File = require("vinyl"),
    fs = require("fs"),
    path = require("path"),
    through = require("through2"),
    streamify = require('stream-array'),
    Buffer = require('buffer').Buffer,
    interpreter = require('eval'),
    StringDecoder = require('string_decoder').StringDecoder;

var decoder = new StringDecoder('utf8');

var ftrue = function () {
    return true
}, ffalse = function () {
    return false
};


function feed(filePath, content) {
    return streamify([
        new File({
            cwd: "./",
            base: path.dirname(filePath),
            path: filePath,
            contents: new Buffer(content, 'utf8'),
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
}

function readXml(fixture) {
    var p = path.resolve(fixture) + ".xml";
    return feed(p, fs.readFileSync(p));
}


function wrap(func, done) {
    return function (file) {
        try {
            func(file);
            done();
        }
        catch (e) {
            done(e);
        }
    }
}


describe("tool / compiling pipe", function () {

    it("should transform xml files into js", function (done) {
        var fixture = "./test/tool/fixtures/2/index";
        readXml(fixture).pipe(streamTool.compiler({verbose:false}))
            .on("data", wrap(function (file) {
                // only filename changes, targetDir should not affect file location
                file.path.should.be.exactly(path.resolve(path.resolve(fixture + ".tpl.js")));
            }, done))
    });

    it("should map relative dependencies if relative to targetDir ", function (done) {
        feed("sources/foo.xml",'<t:require loc="./local" glob="global"/>').pipe(streamTool.compiler({
                targetDir: "./target",
                verbose:false
            }
        )).on("data", wrap(function (file) {
            // file path should stay unchanges (only renamed)
            file.path.should.be.exactly("sources/foo.tpl.js");


            var required={};

            // load template
            var func=interpreter(decoder.write(file.contents),{
                require:function(path){
                    required[path]=true;
                }
            });

            // execute (requires should be lazy loaded)
            func();

            expect(required['../sources/local']).to.be.ok; // mapped relative to target
            expect(required['global']).to.be.ok; // witgout changes

        }, done));

    });
});

describe("tool / rendering pipe", function () {

    var fixture = "./test/tool/fixtures/2/index";


    it("should be should be able to compile and render .html on the fly", function (done) {

        readXml(fixture).pipe(streamTool.compiler({verbose: false}))
            .pipe(streamTool.renderer({
                verbose: false,
                useRequire: false,
                useInterpreter: true, // force using of interpreter
            })).on("data", wrap(function (file) {
                file.path.should.be.exactly(path.resolve(fixture + ".html"));
            }, done))
            .on("error",done);
    });

    it("should be able to render .html by require()'ing compiled modules directly ", function (done) {
        readXml(fixture).pipe(streamTool.compiler({verbose: false}))
            .pipe(streamTool.renderer({
                verbose: false,
                useRequire: true,
                useInterpreter: false,
            })).on("data", wrap(function (file) {
                file.path.should.be.exactly(path.resolve(fixture + ".html"));
            }, done));

    });

    it("should support synchronous transforms", function (done) {
        readXml(fixture).pipe(streamTool.compiler({verbose: false}))
            .pipe(streamTool.renderer({
                verbose: false,
                transform: [
                    function (file) {
                        // generate new file
                        return new File({path: "foo.bar", contents: new Buffer("hello", 'utf8'), stat: file.stat});
                    }, function (file) {
                        // return new buffer
                        return Buffer.concat([file.contents, new Buffer(" world", 'utf8')]);
                    }
                ]
            })).on("data", wrap(function (file) {
                file.path.should.be.exactly("foo.bar");
                decoder.write(file.contents).should.be.exactly("hello world");
            }, done))
    });

    it("should support asynchronous transforms", function (done) {
        readXml(fixture).pipe(streamTool.compiler({verbose: false}))
            .pipe(streamTool.renderer({
                verbose: false,
                transform: [
                    function (file, cb) {
                        cb(null, new File({path: "foo.bar", contents: new Buffer("hello", 'utf8'), stat: file.stat}));
                    }, function (file) {
                        // return promise
                        return commons.promise.resolve(Buffer.concat([file.contents, new Buffer(" world", 'utf8')]));
                    },
                    through.obj(function (file, enc, cb) {
                        file.contents = Buffer.concat([file.contents, new Buffer("!", 'utf8')]);
                        cb(null, file);
                    })
                ]
            })).on("data", wrap(function (file) {
                file.path.should.be.exactly("foo.bar");
                decoder.write(file.contents).should.be.exactly("hello world!");
            }, done))
    });


});


describe("tool / error handling", function () {

    describe("compiler", function () {
        it("should gracefully fail on parse error", function (done) {
            feed("foo.xml", "<parse>error")
                .pipe(streamTool.compiler({verbose: false}))
                .on('error', wrap(function (err) {
                    expect(err.name).to.be.equal('ParseError');
                }, done));
        });

        it("should gracefully fail on compilation error", function (done) {
            feed("foo.xml", "<t:mustFail>always</t:mustFail>")
                .pipe(streamTool.compiler({verbose: false}))
                .on('error', wrap(function (err) {
                    expect(err.name).to.be.equal('CompilerError');
                }, done));
        })
    })

    describe("renderer", function () {
        it("should gracefully fail on syntax error", function (done) {
            feed("foo.js", "var this is a bad code")
                .pipe(streamTool.renderer({verbose: false}))
                .on('error', wrap(function (err) {
                    expect(err.name).to.be.equal('SyntaxError');
                }, done));
        });

        it("should gracefully fail on runtime error", function (done) {
            feed("foo.js", "module.exports = function(){throw 'I failed'}")
                .pipe(streamTool.renderer({verbose: false}))
                .on('error', wrap(function (err) {
                    expect(err).to.be.equal('I failed');
                }, done));
        });

        it("should gracefully fail on missing dependency", function (done) {
            feed("foo.js", "module.exports = require('something out there')")
                .pipe(streamTool.renderer({verbose: false}))
                .on('error', wrap(function (err) {
                    expect(err).to.be.instanceOf(Error);
                }, done));
        });


    })

})

