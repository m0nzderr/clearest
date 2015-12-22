/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

"use strict";
var
    chai = require("chai"),
    expect = chai.expect,
    ex = require("../../tool/expression");


describe("tool / expression syntax",function(){

    it("should tokenize valid plain expressions",function(){
        expect(ex.tokenize("foo")).deep.equal(["foo"]);
        expect(ex.tokenize("f{o}o")).deep.equal(["f{o}o"]);
        expect(ex.tokenize("f$oo")).deep.equal(["f$oo"]);
        expect(ex.tokenize("f$$oo")).deep.equal(["f$$oo"]);
        expect(ex.tokenize("f$}$oo")).deep.equal(["f$}$oo"]);
    })

    it("should tokenize js expressions",function(){
        expect(ex.tokenize("${}")).deep.equal([]);
        expect(ex.tokenize("${{}}")).deep.equal([{js:["{}"]}]);
        expect(ex.tokenize("${o}")).deep.equal([{js:["o"]}]);
        expect(ex.tokenize("f${o}o")).deep.equal(["f",{js:["o"]},"o"]);
        expect(ex.tokenize("f${o}${o}")).deep.equal(["f",{js:["o"]},{js:["o"]}]);
        expect(ex.tokenize("f${{o}}o")).deep.equal(["f",{js:["{o}"]},"o"]);
        expect(ex.tokenize("f{${o}}o")).deep.equal(["f{",{js:["o"]},"}o"]);
        expect(ex.tokenize("f${o}}o")).deep.equal(["f",{js:["o"]},"}o"]);
        expect(ex.tokenize("f${{1{}2{}3}}o")).deep.equal(["f",{js:["{1{}2{}3}"]},"o"]);
    })

    it("should fail on inavlid expressions",function(){
        expect(function(){ex.tokenize("f${o")}).to.throw(Error);
        expect(function(){ex.tokenize("f${o{")}).to.throw(Error);
        expect(function(){ex.tokenize("f${o${ok}")}).to.throw(Error);
        expect(function(){ex.tokenize("f${{{}")}).to.throw(Error);
        expect(function(){ex.tokenize("f${{}{}")}).to.throw(Error);

        expect(function(){ex.tokenize("f{{o}{bar}}")}).to.throw(Error);
        expect(function(){ex.tokenize("f{{o{}{}bar}}")}).to.throw(Error);
    })

    it("should tokenize select expressions",function(){
        expect(ex.tokenize("{{}}")).deep.equal([]);
        expect(ex.tokenize("{{o}}")).deep.equal([{s:"o"}]);
        expect(ex.tokenize("f{{o}}o")).deep.equal(["f",{s:"o"},"o"]);
        expect(ex.tokenize("f{{o}}o{{bar}}")).deep.equal(["f",{s:"o"},"o",{s:"bar"}]);
        expect(ex.tokenize("f{{o}}{{o}}")).deep.equal(["f",{s:"o"},{s:"o"}]);
    })

    it("should tokenize mixed js",function(){
        expect(ex.tokenize("${foo({{bar}})}")).deep.equal([{js:["foo(",{s:"bar"},")"]}]);
    })



});
