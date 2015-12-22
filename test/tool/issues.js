/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Created by M0nZDeRR on 22/12/2015.
 */

var chai = require("chai"),
    expect = chai.expect,
    Processor = require("../../tool/processor.js"),
    dom = new (require("../../tool/domparser"))(),
    xvdl = require("../../tool/xvdl"),
    Compiler = xvdl.Compiler,
    aggregator = require("../../core/aggregator.js"),
    interpreter = require("eval"),
    Api = require("../../core/api");



describe('tool / issues', function () {
    it("#13", function () {
        var processor = new Processor({currentLocation: './foo.xml'});
        expect(function () {
            processor.compile('<w:div w:template=""/>')
        }).to.throw(Error);
    });

    it("#14", function () {
        var env = {
            target:{
                path:'W:\\typi\\Development\\clearest\\test\\fixture.xml',
                dir:'W:\\typi\\Development\\clearest\\test\\'
            }};
        var processor = new Processor({currentLocation: './foo.xml',environment:env });

        template = interpreter(processor.compile('<html>'+
            '1:&env:target.path;'+
            '2:&env:target.dir;'+
            '</html>'));

        expect(template()).to.deep.equal({html:"1:"+env.target.path+"2:"+env.target.dir});
    });
});
