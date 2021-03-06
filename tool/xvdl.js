/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 *  XVDL JavasSript compiler
 */
"use strict";

var codegen = require("./codegen"),
    extend = require("extend"),
    commons = require("../core/commons"),
    constants = require("./constants"),
    expression = require("./expression"),
    errors = require("./errors");

var API = constants.API,
    SYMBOL = constants.SYMBOL,
    COMMENT = commons.constant.COMMENT,
    OBJECT_PATH_SEPARATOR = '.',
    ATTRIBUTE_PREFIX = commons.constant.ATTRIBUTE_PREFIX,
    TEXT_NODE = commons.constant.TEXT_NODE;

var isValue = commons.is.value;

//------------------------------------- xml helpers -----------------------------------

function isText(node) {
    return node.nodeType === node.TEXT_NODE;
}

function isEmpty(node) {
    return !node.childNodes || node.childNodes.length === 0;
}

function nodeNamespaceCondition(condition) {
    return function (node) {
        var nsPrefix = node.nodeName.slice(0, -1 - node.localName.length);
        return condition(nsPrefix);
    }
}

function foreach(nodeSet, iterate, stopCriterion) {
    if (nodeSet)
        for (var i = 0, l = nodeSet.length; i < l; i++)
            if (iterate(nodeSet.item(i), i) && stopCriterion) {
                break;
            }
}

function hasChildrenOfType(node, nodeType) {
    var cache = "cache:hasChildrenOfType:" + nodeType;
    if (node[cache] !== undefined)
        return node[cache];
    var nodeSet = node.childNodes;

    for (var i = 0, l = nodeSet.length; i < l; i++) {
        var child = nodeSet.item(i);
        if (child.nodeType === nodeType)
            return (node[cache] = true);
    }
    return (node[cache] = false);
}

function invertMap(target, map) {
    for (var k in map)
        target[map[k]] = k;
    return target;
}

function textContent(node) {
    var content = '';

    foreach(node.childNodes, function (node) {
        if (node.nodeType == node.TEXT_NODE) {
            content += node.nodeValue;
        }
    });

    return content;
}


//------------ object manipulation helpers --------------

function getProperty(o, path) {
    var key = path.split(OBJECT_PATH_SEPARATOR);

    for (var i in key) {
        if (o === undefined || o === null)
            return;
        o = o[key[i]];
    }
    return o;
}

function _putProperty(o, path, value) {
    var field = path[0];
    if (path.length === 1) {
        o[field] = value;
    }
    else {
        if (isValue(o[field])) {
            throw new CompilerError("Unable to expand property '" + field + "' into object since it already has a value '" + o[field] + "'");
        }
        if (!o[field])
            o[field] = {};
        _putProperty(o[field], path.slice(1), value);
    }
}

function putProperty(o, path, value) {
    return _putProperty(o, path.split(OBJECT_PATH_SEPARATOR), value)

}

function parseObjectPath(string, scope) {
    var expr = string.trim();
    var path = expr.split(OBJECT_PATH_SEPARATOR);
    // foo => context = scope.$context, field = foo
    var context = (scope || {}).$context,
        field = expr;
    // foo.bar.qux => context = foo.bar, fild = qux
    if (path.length > 1) {
        field = path.pop();
        context = path.join(".");
    }

    return {
        context: context,
        field: field
    }
}


//------------------- Compiler Errors -------------------------------------

var CompilerError = errors.CompilerError;
CompilerError.UNDEFINED_CONTEXT = "No context object defined in scope";

function compilerError(msg, node) {
    //TODO: get line numbers and other helpful info
    if (node) {
        if (node.nodeType === node.ELEMENT_NODE) {
            return new CompilerError("<" + node.nodeName + "> : " + msg);
        } else if (node.nodeType === node.ATTRIBUTE_NODE) {
            return new CompilerError("@" + node.nodeName + " : " + msg);
        }
    }
    else
        return new CompilerError(msg);
}

function undefinedContextError(node) {
    return compilerError(CompilerError.UNDEFINED_CONTEXT, node);
}

function explicitContextError(node) {
    throw compilerError("instruction body already has an explicit context", node);
}

function invalidIdentifier(id, node) {
    throw compilerError("'" + id + "' is not a valid identifier", node);
}

//------------------------ Compiler implementation ----------------------

function XvdlCompiler(userConfig) {

    var config = {
            scopeCapture: true,
            resolver: {
                template: function (url, importVariable) {
                    return importVariable || url;
                },
                dependency: function (name, module) {
                    return name;
                },
                inject: function (name, module) {
                    return name;
                }
            },
            namespace: {
                template: "http://xvdl.illya.com.br/1.2/template",
                env: "http://xvdl.illya.com.br/1.2/env",
                event: "http://xvdl.illya.com.br/1.2/event",
                select: "http://xvdl.illya.com.br/1.2/select",
                attribute: "http://xvdl.illya.com.br/1.2/attribute",
                observe: "http://xvdl.illya.com.br/1.2/observe",
                widget: "http://xvdl.illya.com.br/1.2/widget",
                header: "http://xvdl.illya.com.br/1.2/header"
            },
            prefix: { // default namespace prefix mapping (in case of missing xmlns declarations)
                template: "t",
                event: "e",
                env: "env",
                select: "s",
                attribute: "a",
                observe: "o",
                widget: "w",
                header: "h"
            },
            symbol: extend({}, SYMBOL),
            scope: ['$context'],
            closure: {
                template: ['api', 'aggregator', '$context'],
                widget: ['api', 'aggregator'], //TODO 2.2: only add 'aggregator' when its needed.
                event: {args: ["$event", "$widget"]},
                observer: {args: ["$value", "$widget", "$sender"]},
                error: {args: "$error"},
                select: {indexSuffix: "$index"}
            },
            environment: {
                language: "es5"
            }
        },
        namespaceMap = {},
        prefixMap = {},
        closure = {
            control: function (code, args) {
                return codegen.closure({
                    args: codegen.list(args || []),
                    body: code
                });
            },
            eventClosureArguments: function (args, code) {

                var numArgs = 0;

                args.forEach(function (argument, index) {
                    if (code.indexOf(argument) > 0) {
                        if (numArgs < index + 1) {
                            numArgs = index + 1
                        }
                    }
                });

                return codegen.list(args.slice(0, numArgs));
            },
            /**
             * Generates event handler closure from its definition
             *
             *
             * syntax:
             *          = whatever          -> {return whatever }
             *          : whatever          -> whatever
             * auto-guess:
             *
             *          {... code...} -> function($event){...code....}
             *           ... code...; -> function($event){...code....}
             *           ... code = code ... -> function($event){...code....}             *
             *          call.to.something() -> {return call.to.something
             * otherwise
             *          ...code... -> ...code...
             *
             * @param def
             * @returns {*}
             */
            eventHandler: function (args, def) {

                def = def.trim();

                if (def.charAt(0) == '=') {
                    return codegen.closure({
                        args: closure.eventClosureArguments(args, def),
                        ret: def.slice(1)
                    })
                } else if (def.charAt(0) == ':') {
                    return def.slice(1);
                } else if (def.charAt(0) == '{' && def.charAt(def.length - 1) == '}') {
                    return codegen.closure({
                        args: closure.eventClosureArguments(args, def),
                        body: def.slice(1, -1)
                    })
                }
                else if (def.charAt(def.length - 1) == ';') {
                    return codegen.closure({
                        args: closure.eventClosureArguments(args, def),
                        body: def.slice(0, -1)
                    })
                }
                else if (def.indexOf('=') !== -1) {
                    return codegen.closure({
                        args: closure.eventClosureArguments(args, def),
                        body: def
                    })
                }
                else if (def.charAt(def.length - 1) == ')') {
                    // return call
                    return codegen.closure({
                        args: closure.eventClosureArguments(args, def),
                        ret: def
                    });
                }
                else {
                    // return as it is
                    return def;
                }
            }
        },
        attributeInstructions = {
            /**
             * Special instruction, does not produces any output itself
             * @env:variable
             */
            env: function (acc, node, scope, output) {
                if (output)
                    output.value = getProperty(config.environment, node.localName) == node.nodeValue;
            },
            /**
             *
             * @e:foo = "handler"
             * @e:foo.bar = "handler"
             *
             * @param acc
             * @param node
             * @param scope
             */
            event: function (acc, node, scope) {

                var definition = node.localName;
                var tokens = definition.split(".");
                var target = null;
                var args = [];

                if (tokens.length > 1) {
                    // event has specific target
                    target = tokens.slice(0, -1).join('.');
                    args.push(target);
                    definition = tokens.pop();
                }

                args = [codegen.string(definition), closure.eventHandler(config.closure.event.args, node.nodeValue)];

                if (target) {
                    args.push(target);
                }

                acc.push(
                    apicall(API.on, args)
                );
                // has controller
                return true;
            },

            /**
             * @o:object.field ="handler"
             *
             * @param acc
             * @param node
             * @param scope
             */
            observe: function (acc, node, scope) {
                var path = parseObjectPath(node.localName);

                if (!path.context)
                    throw new compilerError("Attribute name must follow the [object].[field] syntax", node);

                acc.push(
                    apicall(API.observe, [path.context, codegen.string(path.field), closure.eventHandler(config.closure.observer.args, node.nodeValue)])
                );

                // has controller
                return true;
            },

            /**
             * @t:foo = "${bar}qux"
             *
             * Template attribute syntax (interpolation)
             *
             * @param acc
             * @param node
             * @param scope
             */
            template: function (acc, node, scope) {
                var flags = {};
                var code = compileExpression(node, scope, false, flags) || codegen.string('', true);
                var o = scope.o || {};
                o[ATTRIBUTE_PREFIX + node.localName] = code;
                if (!scope.o) {
                    // add as separate object, object is not in scope
                    acc.push(code)
                }
                // if it has select operation, promises may appear, so aggregator call is needed
                return flags.needAggregatorCall;
            }
        },
        /**
         * Evauates @env:var=value condition
         * @param node
         * @returns {boolean}
         */
        matchEnvConditions = function (node, scope) {
            var match = true;

            // process env:attribute filter
            if (node.hasAttributes()) {
                foreach(node.attributes, function (node) {
                    if (getInstruction(node) === attributeInstructions.env) {
                        var output = {};
                        attributeInstructions.env([], node, scope, output);
                        match &= output.value;
                    }
                })
            }

            return match;
        },
        conditionalFlowControl = function (conditions, node, scope, flags) {
            var thenBranch = node,
                elseBranch = false, defaultThenBranch = true, defaultElseBranch = true;

            // capture t:then and t:else
            foreach(node.childNodes, function (node) {
                if (getInstruction(node) == elementInstructions.template.then) {
                    if (defaultThenBranch) {
                        thenBranch = node;
                        defaultThenBranch = false;
                    }
                    else
                        throw compilerError("only unique t:then element is allowed", node);
                }
                if (getInstruction(node) == elementInstructions.template.else) {
                    if (defaultElseBranch) {
                        if (defaultThenBranch) {
                            thenBranch = false;
                        }
                        elseBranch = node;
                        defaultElseBranch = false;
                    }
                    else
                        throw compilerError("only unique t:else element is allowed", node);
                }
            });

            flags = {ignoreAttributes: true, keepMultiples: true};
            return codegen.iff({
                cond: conditions.join("&&"),
                then: thenBranch ? compileChildNodes([], thenBranch, scope, flags) : config.symbol.empty,
                else: elseBranch ? compileChildNodes([], elseBranch, scope, flags) : config.symbol.empty
            });
        }
        ,
        elementInstructions = {

            template: {
                /**
                 *
                 * t:fragment
                 *
                 * Seamlessly produces its iternal content.
                 *
                 * If provided with an attribute @variable, its content is matched against corresponding config.environment[@variable],
                 * allowing the processing of build conditions
                 *
                 * @param node
                 * @param scope
                 */
                fragment: function (acc, node, scope) {
                    if (matchEnvConditions(node, scope)) {
                        var flags = {keepMultiples: true};
                        compileChildNodes(acc, node, scope, flags);
                        return flags.needAggregatorCall;
                    }
                },
                /**
                 * t:comment
                 * Encloses generated into comment tags, behaves same as t:fragnment
                 * @param acc
                 * @param node
                 * @param scope
                 */
                comment: function (acc, node, scope) {
                    var sub = [];
                    var nacFlag = elementInstructions.template.fragment(sub, node, scope);
                    if (sub.length) {
                        acc.push(codegen.object(COMMENT, aggregate(sub, {needAggregatorCall: nacFlag})));
                    }
                    return nacFlag;
                },

                /**
                 * t:ignore (exact opposite of t:fragment
                 */
                ignore: function (acc, node, scope) {
                    if (!matchEnvConditions(node, scope)) {
                        var flags = {keepMultiples: true};
                        compileChildNodes(acc, node, scope, flags);
                        return flags.needAggregatorCall;
                    }
                },
                /**
                 * t:if @test @exist @from
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                "if": function (acc, node, scope) {

                    var conditions = [],
                        closureArguments = [], // inner closure arguments: $1, $2, $3
                        countArguments = [], // count request arguments: ["foo","bar","qux"];
                        subContext = scope.$context;

                    if (node.hasAttribute("exist")) {

                        // exist="foo,!bar,qux"

                        var tokens = node.getAttribute("exist").split(","); // token  list: ["foo","!bar","qux"]

                        // process tokens
                        for (var i = 0, l = tokens.length; i < l; i++) {
                            var token = tokens[i];

                            if (token.length == 0)
                                throw compilerError("Malformed conditional expression", node);

                            var neg = (token.charAt(0) === '!'); // negation

                            // something malformed again
                            if (neg && token.length < 1)
                                throw compilerError("Malformed conditional expression", node);

                            closureArguments.push("$" + (i + 1));
                            countArguments.push(codegen.string(neg ? token.slice(1) : token));
                            conditions.push((neg ? '!' : '') + closureArguments[i]);
                        }

                        if (node.hasAttribute("from")) {
                            subContext = node.getAttribute("from");
                        }

                        if (!subContext)
                            throw compilerError("Context is not defined in scope", node);
                    }

                    if (node.hasAttribute("test"))
                        conditions.push("(" + node.getAttribute("test") + ")");

                    if (conditions.length == 0)
                        throw compilerError("condition attribute is missing: @test or @exist", node);

                    var flags = {};
                    var conditionExpression = conditionalFlowControl(conditions, node, scope, flags);

                    if (closureArguments.length == 0) {
                        // only test condition
                        acc.push(conditionExpression);

                        // depends on inner content
                        return flags.needAggregatorCall;
                    } else {
                        // complex condition

                        var innerClosure = codegen.closure({
                                args: codegen.list(closureArguments),
                                ret: conditionExpression
                            }),
                            countCall = apicall(API.count, [subContext, codegen.array(countArguments)]);

                        acc.push(codegen.call({
                            fn: config.symbol.api + API.get,
                            args: codegen.list([innerClosure, countCall])
                        }));

                        // may haves promises
                        return true;
                    }
                },
                /**
                 * t:if-error @type @test @from
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                "if-error": function (acc, node, scope) {

                    // obtain subContext
                    var subContext = scope.$context;

                    if (node.hasAttribute("from")) {
                        subContext = node.getAttribute("from");
                    }

                    if (!subContext)
                        throw compilerError("Context is not defined in scope", node);

                    var args = [subContext, 0];

                    // add type argument
                    if (node.hasAttribute("type")) {
                        args.push(codegen.string(node.getAttribute("type")));
                    }

                    // add test closure
                    if (node.hasAttribute("test")) {
                        args.push(codegen.closure({
                            args: config.closure.error.args,
                            ret: node.getAttribute("test")
                        }));
                    }

                    // omit 0 flag is last
                    if (args.length == 2) {
                        args.pop();
                    }

                    var conditions = [apicall(API.error, args)];

                    var flags = {};
                    var conditionExpression = conditionalFlowControl(conditions, node, scope, flags);

                    acc.push(conditionExpression);

                    // depends on inner content
                    return flags.needAggregatorCall;
                },
                then: function () {
                    throw compilerError("t:then cannot be used without t:if", node);
                },
                else: function () {
                    throw compilerError("t:else cannot be used without t:if", node);
                },

                /**
                 * t:control
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                control: function (acc, node, scope) {

                    if (hasChildrenOfType(node, node.ELEMENT_NODE))
                        throw compilerError("only text content allowed inside t:control instruction", node);

                    var scope = [], args = [];

                    //scope variables
                    if (node.hasAttributes()) {
                        foreach(node.attributes, function (node) {
                            var identifier = node.localName;

                            if (!codegen.isValidIdentifier(identifier))
                                throw invalidIdentifier(identifier, node);


                            args.push(node.localName);
                            //expressions
                            scope.push(node.nodeValue);
                        });
                    }

                    var ctl = closure.control(textContent(node), args);

                    if (scope.length == 0) {
                        acc.push(ctl);
                    } else {
                        acc.push(apicall(API.control, [ctl, codegen.array(scope)]))
                    }
                    // is a controller
                    return true;
                },

                /**
                 *
                 * t:observe
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                observe: function(acc, node, scope){

                    if (hasChildrenOfType(node, node.ELEMENT_NODE))
                        throw compilerError("only text content allowed inside t:observe instruction", node);

                    if (!node.hasAttribute("node"))
                        throw compilerError("@node attribute not specified", node);

                    var context = node.getAttribute("from") || scope.$context;
                    var handlerCode = textContent(node);

                    var flags = {};
                    var nodeExpression = compileExpression(node.getAttributeNode("node"),scope,false,flags);



                    var observeInstruction = function(nodeExpression) {
                        var args = [context, nodeExpression];
                        if (handlerCode) {
                            args.push(closure.eventHandler(config.closure.observer.args,
                                codegen.block(handlerCode) // ensure that code is embraced in {}
                            ))
                        }
                        return apicall(API.observe, args);
                    };

                    if (flags.needAggregatorCall) {
                        // need to wrap into get instruction
                        acc.push(
                            apicall(API.get, [
                                // template closure
                                codegen.closure({
                                    args: codegen.list(['$1']),
                                    ret: observeInstruction('$1')
                                }),
                                codegen.array([nodeExpression])
                            ])
                        );

                        return true;
                    } else {
                        acc.push(
                            observeInstruction(nodeExpression)
                        );
                        return true;
                    }
                },

                /**
                 * t:use
                 *
                 */
                use: function (acc, node, scope) {

                    if (!node.hasAttribute("template"))
                        throw compilerError("instruction must have @template attribute", node);

                    var context = scope.$context,
                        template = node.getAttribute("template"),
                        origin = node.getAttribute("from") || 'source'; //TODO: externalize constant

                    if (!isEmpty(node)) {
                        if (node.hasAttribute("context"))
                            throw compilerError("instruction body not allowed when used with @context attribute", node);

                        context = compileChildNodes([], node, scope, {ignoreAttributes: true});
                    }
                    else {
                        if (node.hasAttribute("context"))
                            context = node.getAttribute("context");
                    }


                    //compile into API call:
                    switch (origin) {
                        case 'source':
                        acc.push(
                                apicall(API.use, [config.resolver.template(template), context])
                            );
                            break;
                        case 'scope':
                            acc.push(
                                apicall(API.use, [template, context])
                            )
                        break;
                        default:
                            throw compilerError("Illegal template origin specified in @from attribute", node);
                    }
                    return true;
                },

                /**
                 * t:context
                 * <t:context/> - retrives context
                 * <t:context var="expr"> - switches context
                 * </t:context>
                 */
                context: function (acc, node, scope) {
                    //<t:context/> - closed form
                    if (isEmpty(node) && !node.hasAttributes()) {

                        if (!scope.$context)
                            throw undefinedContextError(node);

                        // output context
                        acc.push(scope.$context);
                    } else {
                        //<t:context newContext="...">....</t:context> - context switch

                        if (!node.hasAttributes())
                            throw compilerError("there must be at least one expression attribute for context switch", node);

                        var newContext;
                        foreach(node.attributes, function (attribute) {
                            if (attribute.localName === attribute.nodeName) {
                                newContext = attribute.localName;
                                return true;
                            }
                        }, true);
                        // delegate to get instruction, it will put variable in scope
                        return elementInstructions.template.get(acc, node, extend({}, scope, {$context: newContext}))
                    }
                },

                /**
                 * t:select - explicit select
                 * <t:select node="${{{foo}}+{{bar}}}" from="bar"/>
                 */
                select: function (acc, node, scope) {
                    if (!node.hasAttribute("node"))
                        throw compilerError("@node attribute not specified", node);
                    var flags = {};
                    var properyExpression = compileExpression(node.getAttributeNode("node"),scope,false,flags);

                    if (flags.needAggregatorCall) {
                        // has select inside,

                        var buff=[];
                        elementInstructions.select(buff, node, scope, '$1');

                        acc.push(
                            apicall(API.get, [
                                // template closure
                                codegen.closure({
                                    args: codegen.list(['$1']),
                                    ret: buff[0]
                                }),
                                codegen.array([properyExpression])
                            ])
                        );

                        return true;
                    } else
                        // plain js expression
                        return elementInstructions.select(acc, node, scope, properyExpression)
                },

                get: function (acc, node, scope) {

                    // <t:get foo="expression"/>
                    if (!node.hasAttributes())
                        throw compilerError("must be at least one expresson/attribute specified", node);

                    if (isEmpty(node)) {
                        var flags = {needAggregatorCall: false};
                        // pass through all expressions as is
                        foreach(node.attributes, function (attribute) {
                            // compile {{..}}
                            var code = compileExpression(attribute, scope, true, flags);
                            acc.push(code);
                        });
                        return flags.needAggregatorCall;
                    } else {
                        // <t:get foo="expression">....</t:get>
                        // compiles to API.get(function(a,b,c){return template...},[expr1, expr2, expr3...])

                        var variables = [],
                            expressions = [];

                        foreach(node.attributes, function (attribute) {
                            if (!codegen.isValidIdentifier(attribute.localName)) {
                                throw invalidIdentifier(attribute.nodeName, node);

                            }
                            variables.push(attribute.localName);
                            // compile {{..}} syntax
                            expressions.push(compileExpression(attribute, scope, true));
                        });

                        acc.push(
                            apicall(API.get, [
                                // template closure
                                codegen.closure({
                                    args: codegen.list(variables),
                                    ret: compileChildNodes([], node, scope, {
                                        ignoreAttributes: true,
                                        keepMultiples: true
                                    }) // compiled template body
                                }),
                                codegen.array(expressions)
                            ])
                        );


                        // may have promises
                        return true;
                    }


                },


                /**
                 * Error selection
                 * t:error [@from @as @catch @type]
                 */
                error: function (acc, node, scope) {

                    // obtain subContext
                    var subContext = scope.$context;

                    if (node.hasAttribute("from")) {
                        subContext = node.getAttribute("from");
                    }

                    if (!subContext)
                        throw compilerError("Context is not defined in scope", node);

                    var args = [subContext];

                    // add type argument
                    if (node.hasAttribute("type")) {
                        args.push(0);
                        if (node.getAttribute("type") !== constants.SYMBOL.wildcard) {
                            args.push(codegen.string(node.getAttribute("type")));
                        }
                    }
                    else {
                        args.push(1); // catch by default
                        if (node.hasAttribute("catch")) {
                            if (node.getAttribute("catch") !== constants.SYMBOL.wildcard) {
                                args.push(codegen.string(node.getAttribute("catch")));
                            }
                        }
                    }

                    if (isEmpty(node)) {
                        // <t:error/>
                        acc.push(
                            apicall(API.error, args)
                        );
                    }
                    else {
                        // <t:error>...</t:error>

                        var newContext = node.getAttribute("as") || config.closure.error.args;

                        if (!codegen.isValidIdentifier(newContext))
                            throw invalidIdentifier(newContext, node);


                        var flags = {
                            ignoreAttributes: true,
                            keepMultiples: true
                        };

                        args.push(codegen.closure({
                            args: newContext,
                            ret: compileChildNodes([], node, {$context: newContext}, flags)
                        }));

                        acc.push(
                            apicall(API.error, args)
                        );

                        // depends on code inside
                        return flags.needAggregatorCall;
                    }
                },

                /**
                 *
                 * t:require
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                require: function (acc, node, scope) {


                    // add dependencis is conditions are matched
                    foreach(node.attributes, function (node) {
                        var variableName = config.resolver.dependency(node.nodeName, node.nodeValue);

                        //TODO: implement scope management
                        //scope.$root[variableName]=true;
                    });


                    if (!isEmpty(node)) {
                        // generate body template, if provided
                        var flags = {keepMultiples: true, ignoreAttributes: true};
                        compileChildNodes(acc, node, scope, flags);
                        return flags.needAggregatorCall;
                    }
                },
                /**
                 *
                 * t:import
                 *
                 *  imports template from source
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                "import": function (acc, node, scope) {

                    // add dependencis is conditions are matched
                    foreach(node.attributes, function (node) {
                        var variableName = config.resolver.template(node.nodeValue, node.nodeName);
                        //TODO: implement scope management
                        //scope.$root[variableName]=true;
                    });


                    if (!isEmpty(node)) {
                        // generate body template, if provided
                        var flags = {keepMultiples: true, ignoreAttributes: true};
                        compileChildNodes(acc, node, scope, flags);
                        return flags.needAggregatorCall;
                    }
                },

                /**
                 *
                 * t:inject - similar to require, behaves regarding to DI implementaion by API
                 * a may be context dependent
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                inject: function (acc, node, scope) {
                    if (!isEmpty(node))
                        throw compilerError("t:inject instruction with a body is not allowed", node);

                    foreach(node.attributes, function (node) {
                        var variableName = config.resolver.inject(node.nodeName, node.nodeValue);

                        //TODO: implement scope management
                        //scope.$root[variableName]=true;
                    });
                },

                /**
                 *
                 * t:script
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                script: function (acc, node, scope) {
                    acc.push(
                        codegen.closure({
                                body: textContent(node),
                                call: " "
                            }
                        )
                    );
                }
            },

            /**
             * Select instruction
             * s:* [@from @as (@where (@orderby || @order)|| @filter)]
             */
            select: function (acc, node, scope, propertyExpression) {

                // deal witrh @from attribute
                var context = node.getAttribute("from") || scope.$context;

                if (!context)
                    throw compilerError("Context is undefined", node);

                var selectArgs;

                if (isEmpty(node)) {
                    // <s:foo/>

                    selectArgs = [context, propertyExpression || codegen.string(node.localName)];

                    if (node.hasAttribute("where")) {
                        selectArgs.push("false"); // filler
                        selectArgs.push(codegen.closure({
                            args: codegen.list(itemClosureArgs),
                            ret: compileExpression(node.getAttribute("where"), scope, true)
                        }));
                    }

                    if (node.hasAttribute("orderby")) {
                        if (!node.hasAttribute("where")) {
                            selectArgs.push("false"); // filler
                            selectArgs.push("false"); // filler
                        }
                        selectArgs.push(codegen.closure({
                            args: codegen.list(itemClosureArgs),
                            ret: compileExpression(node.getAttribute("orderby"), scope, true)
                        }));
                    } else if (node.hasAttribute("order")) {
                        selectArgs.push(node.getAttribute("order"));
                    }
                }
                else {
                    // <s:foo>...</s:foo>

                    var property = propertyExpression || codegen.string(node.localName);
                    // deal witrh @as attribute
                    var newContext = node.getAttribute("as") || node.localName;

                    if (!codegen.isValidIdentifier(newContext))
                        throw invalidIdentifier(newContext, node);

                    var itemClosureArgs = [newContext, newContext + config.closure.select.indexSuffix];

                    selectArgs = [context,
                        property,
                        codegen.closure({
                            args: codegen.list(itemClosureArgs),
                            ret: compileChildNodes([], node, {$context: newContext}, {
                                ignoreAttributes: true,
                                keepMultiples: true
                            })
                        })];

                    if (node.hasAttribute("where")) {
                        selectArgs.push(codegen.closure({
                            args: codegen.list(itemClosureArgs),
                            ret: compileExpression(node.getAttribute("where"), scope, true)
                        }));
                    }

                    if (node.hasAttribute("orderby") || node.hasAttribute("order")) {
                        if (!node.hasAttribute("where"))
                            selectArgs.push("false"); // filler

                        if (!node.hasAttribute("order")) {
                            selectArgs.push(codegen.closure({
                                args: codegen.list(itemClosureArgs),
                                ret: compileExpression(node.getAttribute("orderby"), scope, true)
                            }));
                        } else {
                            selectArgs.push(node.getAttribute("order"));
                        }
                    }

                    //TODO: implement @filter

                }

                acc.push(
                    apicall(API.select, selectArgs)
                );

                // may return promises
                return true;
            },
            header: {},

            /**
             * w:*
             *
             * Creates a wdiget component
             *
             * @param acc
             * @param node
             * @param scope
             */
            widget: function (acc, node, scope) {
                //TODO: insert additional arguments for clsure separation into closureArguments, and to widgetArguments (at the end)

                var closureArguments = config.closure.widget.map(function (argument) {
                    return config.symbol[argument];
                });

                var implicitContext = false;

                var isInternalAttribute = nodeNamespaceCondition(function (prefix) {
                    return prefix !== "" && prefix != config.prefix.widget
                });

                var isWidgetAttribute = nodeNamespaceCondition(function (prefix) {
                    return prefix === config.prefix.widget
                });


                var widgetArguments = [];

                //FIXME: use namespaces instead of prefix!
                var widgetPrefix = config.prefix.widget;
                var templatePrefix = config.prefix.template;


                if (node.hasAttribute(widgetPrefix + ":template")) {

                    if (node.getAttribute(widgetPrefix + ":template").trim().length == 0) {
                        throw compilerError("Template source must be specified", node);
                    }

                    // external widget: <w:* template='...'>...</w:*>
                    var templateVariable = config.resolver.template(node.getAttribute(widgetPrefix + ":template"));
                    widgetArguments.push(templateVariable);
                    if (!isEmpty(node)) {
                        // explicit context


                        if (node.hasAttribute(widgetPrefix + ":context")) {
                            throw explicitContextError(node);
                        }

                        var contextFunction = codegen.closure({
                            args: closureArguments,
                            ret: compileChildNodes([], node, scope, {attributeFilter: isInternalAttribute})
                        });
                        widgetArguments.push(contextFunction);
                    }
                    else {
                        implicitContext = true;

                        var contextVariable = node.getAttribute(widgetPrefix + ":context") || scope.$context;
                        if (!contextVariable) {
                            throw undefinedContextError(node);
                        }
                        widgetArguments.push(contextVariable);
                    }
                }
                else {
                    // inline widget: <w:*>....<w:*>


                    if (config.scopeCapture) {
                        closureArguments.push(scope.$context);
                    }

                    var templateFunction = codegen.closure({
                        args: closureArguments,
                        ret: compileChildNodes([], node, scope, {
                            attributeFilter: isInternalAttribute
                        })
                    });
                    widgetArguments.push(templateFunction);

                    if (config.scopeCapture) {
                        widgetArguments.push(scope.$context);
                    }
                }


                var o = {}, accumulator = [], widgetParams = {}, hasWidgetParams = false;

                scope.o = o;

                // process external and widget attributes
                accumulateAttributes(accumulator, node.attributes, scope, {
                    attributeFilter: function (node) {

                        if (implicitContext && isInternalAttribute(node))
                            throw compilerError("Context must be explicit in order be extended. Use @:* attributes instead", node);

                        if (isWidgetAttribute(node)) {
                            var PREFIX = "set.";

                            if (node.localName.indexOf(PREFIX) === 0) {
                                hasWidgetParams = true;
                                putProperty(widgetParams, node.localName.slice(PREFIX.length), node.nodeValue);
                            }
                        }

                        // explicitly static (t:*) attributes are compiled outside widget
                        return node.nodeName === node.localName;
                    }
                });

                if (hasWidgetParams) {
                    if (widgetArguments.length == 1) {
                        widgetArguments.push(scope.$context);
                    }
                    widgetArguments.push(codegen.object(widgetParams));
                }

                // add stub template
                if (node.hasAttribute(widgetPrefix + ":stub")) {
                    // simulate t:use
                    accumulator.push(apicall(API.use, [config.resolver.template(node.getAttribute(widgetPrefix + ":stub")), scope.$context]));
                }

                // add widget controller
                accumulator.push(apicall(API.widget, widgetArguments));

                acc.push(
                    codegen.object(
                        node.localName,
                        aggregate(accumulator, {needAggregatorCall: true})
                    )
                );

                // has controller
                return true;
            }

        };

    (this.configure = function (userConfig) {
        if (userConfig === undefined)
            return config;
        extend(true, config, userConfig);
        // build maps
        invertMap(namespaceMap, config.namespace);
        invertMap(prefixMap, config.prefix);

        return config;
    })(userConfig || {});


    function getInstructionKey(node) {
        var isElement = (node.nodeType === node.ELEMENT_NODE),
            isAttribute = (node.nodeType === node.ATTRIBUTE_NODE);

        if (!(isElement || isAttribute))
            return; // not an instruction

        // check namespaceURI
        var key = namespaceMap[node.namespaceURI]
            || prefixMap[node.nodeName.slice(0, -1 - node.localName.length)];

        return key;
    }

    function getInstruction(node) {

        var //isElement = (node.nodeType === node.ELEMENT_NODE),
        //isAttribute = (node.nodeType === node.ATTRIBUTE_NODE),
            key = getInstructionKey(node);

        if (!key)
            return; // not an instruction

        var instructionSet = (node.nodeType === node.ELEMENT_NODE) ?
            elementInstructions[key] :
            attributeInstructions[key];

        /*if (!instructionSet) {
         if (isAttribute)
         throw compilerError("unknown instruction", node);
         return; // not an instruction
         }*/

        if (!instructionSet)
            return;

        // wildcard pattern instruction (like t:* or @t:*)
        if (typeof instructionSet === 'function')
            return instructionSet;

        // specific instruction

        var instruction = instructionSet[node.localName];

        if (!instruction) {
            throw compilerError("unknown instruction", node);
        }

        return instruction;
    }


    function isBasicElement(node) {
        return (node.nodeType === node.ELEMENT_NODE);
    }

    function accumulateNodes(acc, nodeSet, scope) {
        //acc = acc || [];
        var needAggregatorCall = false;

        foreach(nodeSet, function (node) {
            needAggregatorCall |= compileElement(acc, node, scope);
        });

        return needAggregatorCall;
    }

    function accumulateAttributes(acc, nodeSet, scope, flags) {
        var o = {}, needAggregatorCall = false;
        scope.o = o;

        foreach(nodeSet, function (node) {

            if (flags && flags.attributeFilter) {
                // apply filter
                if (!flags.attributeFilter(node))
                    return;
            }

            var attributeInstruction = getInstruction(node);

            if (attributeInstruction) {
                needAggregatorCall |= attributeInstruction(acc, node, scope);
            } else {
                // basic attribute
                if (node.nodeName !== "xmlns" && node.nodeName.indexOf("xmlns:") == 0)
                    return; // skip xmlns declarations

                // put only non-instruction attributes here
                //old spec: o["@" + node.nodeName] = codegen.string(node.nodeValue, true); // spaces are preserved
                //new spec: always compile as template
                needAggregatorCall |= attributeInstructions.template(acc, node, scope);
            }
        });

        // add static attributes
        if (Object.keys(o).length != 0)
            acc.push(codegen.object(o));

        return needAggregatorCall;
    }

    function aggregate(accumulator, flags) {
        accumulator = accumulator.filter(function (o) {
            // drop empty nodes
            return o != "undefined";
        });

        if (accumulator.length == 0) {
            return config.symbol.empty;
        }
        else {
            var aggregatorCall = (flags && flags.needAggregatorCall) ||
                (accumulator.length > 1 && !(flags && flags.keepMultiples));

            return aggregatorCall ? codegen.call({
                fn: config.symbol.aggregator,
                args: accumulator.length == 1 ? accumulator[0] : codegen.list(accumulator)
            }) :
                accumulator.length == 1 ? accumulator[0] : codegen.array(accumulator);
        }
    }

    function compileChildNodes(acc, node, scope, flags) {
        var needAggregatorCall = false;
        if (!(flags && flags.ignoreAttributes)) {
            needAggregatorCall |= accumulateAttributes(acc, node.attributes, scope, flags);
        }
        needAggregatorCall |= accumulateNodes(acc, node.childNodes, scope);
        if (flags && needAggregatorCall)
            flags.needAggregatorCall = true;
        //var direct = !hasInstructions && !hasChildrenOfType(node, node.ELEMENT_NODE);
        return aggregate(acc, flags);
    }

    function compileElement(acc, node, scope) {
        var elementInstruction = getInstruction(node);
        if (elementInstruction) {
            return elementInstruction(acc, node, scope);
        } else if (isBasicElement(node)) {
            var flags = {};
            acc.push(
                codegen.object(
                    node.nodeName,
                    compileChildNodes([], node, scope, flags)
                )
            );
            return flags.needAggregatorCall;
        }
        else if (isText(node)) {
            acc.push(
                codegen.string(node.nodeValue,
                    node.previousSibling === null && node.nextSibling === null // preserve spaces when this is a content of text-only element, e.g. <foo>  text  </foo>
                )
            );
        }
        // no controller at this level
        return false;
    }

    /**
     * Provides closure arguments for template
     * @returns {Array|*}
     */
    this.templateArguments = function templateArguments() {
        return config.closure.template.map(function (argument) {
            return config.symbol[argument];
        });
    };

    function apicall(fn, args) {
        return codegen.call({
            fn: config.symbol.api + fn,
            args: codegen.list(args)
        });
    }


    function compileExpression(node, scope, jsMode, flags) {

        var hasSelect = false, args = [], values = [];
        var code = expression.compile(node.nodeValue || node, function (string) {
            hasSelect = true;
            var expr = parseObjectPath(string, scope);
            var variable = "$" + (args.length + 1);
            args.push(variable);
            values.push(apicall(API.select, [
                expr.context,
                codegen.string(expr.field)
            ]));

            return variable;
        }, jsMode);

        if (hasSelect) {

            if (args.length === 1 && code === args[0]) {
                // optimize single select expression
                code = values[0];
            }
            else {
                // wrap expression into get to resolve promises before expression is evaluated
                code = apicall(API.get, [codegen.closure({
                    args: codegen.list(args),
                    ret: code
                }), codegen.array(values)]);
            }
        }

        (flags || {}).needAggregatorCall |= hasSelect;

        return code;
    }

    this.apicall = apicall;

    this.compile = function (xmlDocument, scope) {

        if (!xmlDocument)
            return config.symbol.empty;

        var acc = [], initialScope = extend({$context: config.symbol.$context}, scope);

        if (!xmlDocument.documentElement || !(xmlDocument.documentElement.nodeType === xmlDocument.ELEMENT_NODE)) {
            throw compilerError("Document must have root element", (xmlDocument.documentElement || xmlDocument));
        }

        var needAggregatorCall = compileElement(acc, xmlDocument.documentElement, initialScope);
        return aggregate(acc, {needAggregatorCall: needAggregatorCall || (acc.length > 1)});
    }

}

module.exports = {Compiler: XvdlCompiler};
