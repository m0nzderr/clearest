/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";
var
    DOMParser = require("../../tool/domparser"),
    chai = require("chai"),
    expect = chai.expect;

describe('tool / dom parser ', function () {

    it("should parse xml",function(){
        var dom = new DOMParser();
        var doc =  dom.parseFromString("<foo/>");
        expect(doc.documentElement).to.be.ok;
        expect(doc.documentElement.nodeName).to.be.equal("foo");
    });

    it("should allow providing custom entities",function(){
        var dom = new DOMParser({entities:{"bar":"42"}});
        var doc =  dom.parseFromString("<foo>&bar;</foo>");
        expect(doc.documentElement).to.be.ok;
        expect(doc.documentElement.nodeName).to.be.equal("foo");
        expect(doc.documentElement.childNodes.item(0).nodeValue).to.be.equal("42");
    });

    it("should handle W3C-complient entity names",function(){
        var dom = new DOMParser({entities:{"foo:bar.qux.dox":"42"}});
        var doc =  dom.parseFromString("<foo>&foo:bar.qux.dox;</foo>");
        expect(doc.documentElement).to.be.ok;
        expect(doc.documentElement.nodeName).to.be.equal("foo");
        expect(doc.documentElement.childNodes.item(0).nodeValue).to.be.equal("42");
    });


})