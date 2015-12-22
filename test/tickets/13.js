/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Created by M0nZDeRR on 21/12/2015.
 */
//https://github.com/m0nzderr/clearest/issues/13


var chai = require("chai"),
    expect = chai.expect,
    Processor = require("../../tool/processor.js"),
    aggregator = require("../../core/aggregator.js"),
    interpreter = require("eval"),
    Api = require("../../core/api");


describe('#compiled code', function () {
    it("should fail gracefully on empty template", function () {
        var processor = new Processor({currentLocation: './foo.xml'});
        expect(function () {
            processor.compile('<w:div w:template=""/>')
        }).to.throw(Error);
    });
});


