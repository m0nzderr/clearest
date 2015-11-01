/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */
/**
 *  XVDL JavasSript compiler
 */
var codegen = require("./codegen"),
    extend = require("extend"),
    commons = require("../commons"),
    constants = require("./constants"),
    errors = require("./errors");

var API = constants.API,
    SYMBOL = constants.SYMBOL,
    COMMENT = commons.constant.COMMENT;

//------------------------------------- helpers -----------------------------------

function isText(node) {
    return node.nodeType === node.TEXT_NODE;
}

function isEmpty(node) {
    return !node.childNodes || node.childNodes.length === 0;
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

function valueOf(o, path) {
    var key = path.split(".");

    for (var i in key) {
        if (o === undefined || o === null)
            return;
        o = o[key[i]];
    }
    return o;
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
            scopeCapture:true,
            resolver: {
                template: function (url) {
                    return url;
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
                template: "t:",
                event: "e:",
                env: "env:",
                select: "s:",
                attribute: "a:",
                observe: "o:",
                widget: "w:",
                header: "h:"
            },
            symbol: extend({}, SYMBOL),
            scope: ['$context'],
            closure: {
                template: ['api', 'aggregator', '$context'],
                widget: ['api', 'aggregator'], //TODO: only add 'aggregator' when its needed.
                event: {args: "$event"},
                select: {indexSuffix: "$index"}
            },
            environment: {}
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
            eventHandler: function (def) {
                //FIXME: preserve caller context!
                // literal: "{...code...}" -> function($event){...code...}
                if (def.charAt(0) == '{' && def.charAt(def.length - 1) == '}') {
                    return codegen.closure({
                        args: config.closure.event.args,
                        body: def.slice(1, -1)
                    })
                }
                else if (def.charAt(def.length - 1) == ')') {
                    // "foo.bar(...)" -> function($event){return foo.bar(...)}
                    return codegen.closure(
                        {
                            args: config.closure.event.args,
                            ret: def
                        });
                }
                else {
                    // "foo.bar" -> "foo.bar"
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
                    output.value = valueOf(config.environment, node.localName) == node.nodeValue;
            },
            /**
             *
             * @e:foo = "handler"
             *
             * @param acc
             * @param node
             * @param scope
             */
            event: function (acc, node, scope) {
                acc.push(closure.control(
                    apicall(API.on, ["this", codegen.string(node.localName), closure.eventHandler(node.nodeValue)])
                ));
                // has controller
                return true;
            }
        },
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
                    var match = true;

                    // process env:attribute filter
                    if (node.hasAttributes()) {
                        foreach(node.attributes, function (node) {
                            if (getInstruction(node) === attributeInstructions.env) {
                                output = {};
                                attributeInstructions.env([], node, scope, output);
                                match &= output.value;
                            }
                        })
                    }


                    if (match) {
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
                comment: function( acc, node, scope){
                    var sub = [];
                    var nacFlag = elementInstructions.template.fragment(sub, node, scope);
                    if (sub.length){
                        acc.push(codegen.object(COMMENT, aggregate(sub, {needAggregatorCall: nacFlag})));
                    }
                    return nacFlag;
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
                            throw compilerError("Context is not defined in scop", node);
                    }

                    if (node.hasAttribute("test"))
                        conditions.push("(" + node.getAttribute("test") + ")");

                    if (conditions.length == 0)
                        throw compilerError("condition attribute is missing: @test or @exist", node);

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

                    var flags = {ignoreAttributes: true, keepMultiples: true};
                    var conditionExpression = codegen.iff({
                        cond: conditions.join("&&"),
                        then: thenBranch ? compileChildNodes([], thenBranch, scope, flags) : config.symbol.empty,
                        else: elseBranch ? compileChildNodes([], elseBranch, scope, flags) : config.symbol.empty
                    });

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
                 * t:use
                 *
                 */
                use: function (acc, node, scope) {

                    if (!node.hasAttribute("template"))
                        throw compilerError("instruction must have @template attribute", node);

                    var context = scope.$context,
                        template = node.getAttribute("template");

                    if (!isEmpty(node)) {
                        if (node.hasAttribute("context"))
                            throw compilerError("instruction body not allowed when used with @context attribute", node);

                        context = compileChildNodes([], node, scope, {ignoreAttributes: true});
                    }
                    else {
                        if (node.hasAttribute("context"))
                            context = node.getAttribute("context");
                    }


                    acc.push(
                        //relay template through API call:
                        apicall(API.use, [config.resolver.template(template), context])
                    );

                    return true;
                },

                /**
                 * t:context
                 *
                 * <t:context/> - retrives context
                 * TODO:
                 *
                 * <t:context var="expr"> - switches context
                 *
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
                get: function (acc, node, scope) {

                    // <t:get foo="expression"/>
                    if (!node.hasAttributes())
                        throw compilerError("must be at least one expresson/attribute specified", node);

                    if (isEmpty(node)) {
                        // pass through all expressions as is
                        foreach(node.attributes, function (attribute) {
                            var expression = attribute.nodeValue;
                            // implement other expression syntaxes here
                            acc.push(expression);
                        });
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
                            //TODO: implement other expression syntaxes here
                            expressions.push(attribute.nodeValue);
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
                 *
                 * t:require
                 *
                 * @param acc
                 * @param node
                 * @param scope
                 */
                require: function (acc, node, scope) {
                    if (!isEmpty(node))
                        throw compilerError("t:require instruction with a body is not allowed", node);

                    foreach(node.attributes, function (node) {
                        var variableName = config.resolver.dependency(node.nodeName, node.nodeValue);

                        //TODO: implement scope management
                        //scope.$root[variableName]=true;
                    });
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

                //TODO: implement t:get
                //TODO: implement t:catch
            },

            /**
             * Select instruction
             * s:* [@from @as (@where @orderby || @filter)]
             */
            select: function (acc, node, scope) {

                // deal witrh @from attribute
                var context = node.getAttribute("from") || scope.$context;

                if (!context)
                    throw compilerError("Context is undefined", node);

                if (isEmpty(node)) {
                    // <s:foo/>
                    acc.push(
                        apicall(API.select, [context, codegen.string(node.localName)])
                    );
                }
                else {
                    // <s:foo>...</s:foo>

                    var property = node.localName;
                    // deal witrh @as attribute
                    var newContext = node.getAttribute("as") || property;

                    if (!codegen.isValidIdentifier(newContext))
                        throw invalidIdentifier(newContext, node);

                    var args = [newContext, newContext + config.closure.select.indexSuffix];

                    //TODO: implement @where
                    //TODO: implement @orderBy
                    //TODO: implement @filter
                    acc.push(
                        apicall(API.select, [
                            context,
                            codegen.string(property),
                            codegen.closure({
                                args: codegen.list(args),
                                ret: compileChildNodes([], node, {$context: newContext}, {
                                    ignoreAttributes: true,
                                    keepMultiples: true
                                })
                            })
                        ])
                    );
                }

                // may return promises
                return true;
            },
            header: {},

            //TODO: implement widget
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
                //TODO: implement widget attributes processing (w:@*)
                //TODO: insert additional arguments for clsure separation into closureArguments, and to widgetArguments (at the end)

                var closureArguments = config.closure.widget.map(function (argument) {
                    return config.symbol[argument];
                });

                var widgetArguments = [];

                if (node.hasAttribute("template")) {
                    // external widget: <w:* template='...'>...</w:*>
                    var templateVariable = config.resolver.template(node.getAttribute("template"));
                    widgetArguments.push(templateVariable);
                    if (!isEmpty(node)) {
                        // explicit context
                        if (node.hasAttribute("context")) {
                            throw explicitContextError(node);
                        }

                        var contextFunction = codegen.closure({
                            args: closureArguments,
                            ret: compileChildNodes([], node, scope, {ignoreAttributes: true})
                        });
                        widgetArguments.push(contextFunction);
                    }
                    else {
                        var contextVariable = node.getAttribute("context") || scope.$context;
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
                        ret: compileChildNodes([], node, scope, {ignoreAttributes: true})
                    });
                    widgetArguments.push(templateFunction);

                    if (config.scopeCapture) {
                        widgetArguments.push(scope.$context);
                    }
                }

                //TODO: add static attributes
                acc.push(
                    codegen.object(
                        node.localName,
                        aggregate([
                            apicall(API.widget, widgetArguments)
                        ], {needAggregatorCall:true})
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
            || prefixMap[node.nodeName.slice(0, -node.localName.length)];

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

    function accumulateAttributes(acc, nodeSet, scope) {
        var o = {}, needAggregatorCall = false;
        foreach(nodeSet, function (node) {

            var attributeInstruction = getInstruction(node);

            if (attributeInstruction) {
                needAggregatorCall |= attributeInstruction(acc, node, scope);
            } else {
                // basic attribute
                if (node.nodeName !== "xmlns" && node.nodeName.indexOf("xmlns:") == 0)
                    return; // skip xmlns declarations

                // put only non-instruction attributes here
                o["@" + node.nodeName] = codegen.string(node.nodeValue, true); // spaces are preserved
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
            needAggregatorCall |= accumulateAttributes(acc, node.attributes, scope);
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

    this.apicall = apicall;

    this.compile = function (xmlDocument, scope) {

        if (!xmlDocument)
            return config.symbol.empty;

        var acc = [], initialScope = extend({$context: config.symbol.$context}, scope);

        if (!xmlDocument.documentElement || !(xmlDocument.documentElement.nodeType === xmlDocument.ELEMENT_NODE)) {
            throw compilerError("Document must have root element", (xmlDocument.documentElement || xmlDocument));
        }

        var needAggregatorCall = compileElement(acc, xmlDocument.documentElement, initialScope);
        return aggregate(acc, {needAggregatorCall:needAggregatorCall || (acc.length > 1)});
    }

}

module.exports = {Compiler: XvdlCompiler};
