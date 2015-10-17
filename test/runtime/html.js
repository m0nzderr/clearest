/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
"use strict"

//TODO: rewrite with BDD interface, stop using qunit shim
var qunit = require("../shim/qunit.js"), test = qunit.test, deepEqual = qunit.deepEqual, equal = qunit.equal, ok = qunit.ok,
commons = require("../../runtime/commons.js"),
    agg = require("../../runtime/aggregator.js"),
    html = require("../../runtime/html.js");


describe("#clearest-runtime", function () {

    describe("#html", function () {

        test("values", function () {

            equal(html('foo'), 'foo', 'value');
            equal(html('bar', 'foo'), '<foo>bar</foo>', 'value+tag');
            equal(html({$: 'foo'}), 'foo', 'value node');
            equal(html({$: 'foo'}, 'bar'), '<bar>foo</bar>', 'value node+tag');
            equal(html({}, 'bar'), '<bar/>', 'empty node+tag');
            equal(html('', 'bar'), '<bar></bar>', 'empty string node+tag');
            equal(html({$: ''}, 'bar'), '<bar></bar>', 'empty string node+tag');
            equal(html({$: ''}, 'bar'), '<bar></bar>', 'empty string node+tag');

        });

        test("plain objects", function () {

            equal(html({foo: 'bar'}), '<foo>bar</foo>', '1 value property');
            equal(html({
                foo: 'bar',
                qux: 'fix',
                '@foo': 'hidden'
            }), '<foo>bar</foo><qux>fix</qux>', 'many value properties');
            equal(html({foo: [1, 'bar', 3]}), '<foo>1</foo><foo>bar</foo><foo>3</foo>', 'array properties');
            equal(html({foo: {}}), '<foo/>', 'object properties');
            equal(html({foo: {$: 'bar'}}), '<foo>bar</foo>', 'object properties');
            equal(html({
                foo: {
                    $: 'bar',
                    qux: [1, 2, {data: [3, 4, {foo: 'text'}]}]
                }
            }), '<foo>bar<qux>1</qux><qux>2</qux><qux><data>3</data><data>4</data><data><foo>text</foo></data></qux></foo>', 'nested stuff');

        });

        test("attributes objects", function () {
            equal(html({foo: {'@bar': 'qux'}}), '<foo bar="qux"/>', 'attributes (no body)');
            equal(html({foo: {'@bar': null}}), '<foo/>', 'attributes (null value)');
            equal(html({foo: {'@bar': ''}}), '<foo bar=""/>', 'attributes (empty value)');
            equal(html({foo: {'@bar': {}}}), '<foo bar=""/>', 'attributes (empty value)');
            equal(html({foo: {'@bar': []}}), '<foo bar=""/>', 'attributes (empty value)');
            equal(html({foo: {'@bar': 'qux', $: 'bar'}}), '<foo bar="qux">bar</foo>', 'attributes (with body)');
            equal(html({foo: {$: 'bar', '@bar': 'qux'}}), '<foo bar="qux">bar</foo>', 'attributes (with body)');
            equal(html({foo: {'@bar': ['qux', 1, 2, 'data']}}), '<foo bar="qux12data"/>', 'complex attributes');
            equal(html({foo: {'@bar': ['qux', {$: 1}, 2, 'data']}}), '<foo bar="qux12data"/>', 'complex attributes');
            equal(html({
                foo: {
                    '@bar': ['qux', {
                        foo: {
                            $: 1,
                            '@hitme': 'its impossible!'
                        }
                    }, 2, 'data']
                }
            }), '<foo bar="qux<foo hitme=&quot;its impossible!&quot;>1</foo>2data"/>', 'very complex attributes');
        });

        test("composits", function () {
            equal(html(agg('foo', 'bar')), 'foobar', 'composition of values');
            equal(html(agg('foo', {data: {}}, 'bar')), 'foo<data/>bar', 'composition of values and nodes');
            equal(html(agg({data: 1, foo: 1}, {data: 2}, {
                data: 3,
                foo: 2
            })), '<data>1</data><foo>1</foo><data>2</data><data>3</data><foo>2</foo>', 'interleved peoperties');
            equal(html(agg({data: 1, foo: 1, '@bar': '1'}, {data: 2}, {
                data: 3,
                foo: 2,
                '@bar': '2'
            }), 'test'), '<test bar="12"><data>1</data><foo>1</foo><data>2</data><data>3</data><foo>2</foo></test>', 'attribute composition (may change!!!)');
            equal(html(agg({
                data: 1,
                foo: {bar: agg('foo', {data: {}}, 'bar')}
            }), 'test'), '<test><data>1</data><foo><bar>foo<data/>bar</bar></foo></test>', 'nested composits');

        });

    });

});