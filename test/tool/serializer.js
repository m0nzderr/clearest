/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 * Created by M0nZDeRR on 30/10/2015.
 */
var chai = require("chai"),
    expect = chai.expect,
    commons = require("../../core/commons"),
    inside = commons.inside,
    Serializer = require("../../tool/serializer.js");

describe("tool / serializer", function(){
   it("should serialize simple elements",function(){
       var ser = new Serializer();
       expect(ser.serialize(undefined)).to.be.equal("undefined");
       expect(ser.serialize(null)).to.be.equal("null");
       expect(ser.serialize(42)).to.be.equal('42');
       expect(ser.serialize('foo')).to.be.equal('"foo"');
   });
    it("should serialize objects, functions and call custom serializers",function(){
        var ser = new Serializer();
        var f = function (a,b,c){return a+b+c};
        expect(ser.serialize(f)).to.be.equal(f.toString());
        expect(ser.serialize({})).to.be.equal('{}');
        expect(ser.serialize({foo:42})).to.be.equal('{foo:42}');
        expect(ser.serialize({foo:"42"})).to.be.equal('{foo:"42"}');
        var o={};
        inside(o).serialize = function(ser){return ser.serialize('custom!');}
        expect(ser.serialize(o)).to.be.equal('"custom!"');
    });
    //it("should serialize recursive references ")
});