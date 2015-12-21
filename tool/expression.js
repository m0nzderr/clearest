/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */


/**
 * Parses ES6-style expression
 * @param string
 */

var codegen = require("./codegen");

var FLUSH = -1,
    PLAIN = 0,
    DOLLAR = 1,
    JS_EXPRESSION = 2,
    OPEN_BRACE = 3,
    SELECT_EXPRESSION = 4,
    CLOSE_BRACE = 5;

function tokenize(string) {

    var state = PLAIN, braces = 0;

    var buffer = '', bufferState = state, res = [];

    function store(c) {
        if (bufferState !== state && buffer.length > 0) {
            if (bufferState === PLAIN) {
                res.push(buffer);
            } else if (bufferState === JS_EXPRESSION) {
                res.push({js: tokenize(buffer)});
            } else if (bufferState === SELECT_EXPRESSION) {
                res.push({s: buffer});
            }
            buffer = '';

        }

        bufferState = state;

        buffer += c;
    }

    function goto(newState) {
        state = newState;
    }


    var lc = null, c = null;

    for (var i = 0, l = string.length; i < l; i++) {

        lc = c;
        c = string.charAt(i);

        switch (state) {
            case PLAIN:
                // expect  $
                if (c === '$') {
                    goto(DOLLAR);
                }
                else if (c === '{') {
                    goto(OPEN_BRACE);
                }
                else
                    store(c);
                break;
            case OPEN_BRACE:
                // expect {
                if (c === '{') {
                    goto(SELECT_EXPRESSION);
                }
                else if (c === '$') {
                    goto(PLAIN);
                    store('{');
                    goto(DOLLAR);
                }
                else {
                    //revert back to PLAIN
                    goto(PLAIN);
                    // store $ back to buffer
                    store('{');
                    store(c);
                }
                break;

            case DOLLAR:
                // expect {
                if (c === '{') {
                    goto(JS_EXPRESSION);
                    braces++;
                }
                else {
                    //revert back to PLAIN
                    goto(PLAIN);
                    // store $ back to buffer
                    store('$');
                    store(c);
                }
                break;
            case JS_EXPRESSION:

                if (c == '{') {
                    braces++;
                } else if (c === '}') {
                    braces--;
                }

                if (braces < 0)
                    throw new Error("Unexpected closing brace at char (" + i + "):" + string.slice(0, i));

                if (braces == 0) {
                    goto(PLAIN);
                    // add separator
                    store('');
                } else {
                    store(c);
                }
                break;
            case SELECT_EXPRESSION:
                if (c == '}') {
                    goto(CLOSE_BRACE)
                } else {
                    store(c);
                }
                break;
            case CLOSE_BRACE:
                if (c == '}') {
                    goto(PLAIN);
                    store('');
                } else
                    throw new Error("Missing closing brace at char (" + i + "):" + string.slice(0, i));

                break;
        }
    }

    if (state != PLAIN)
        throw new Error("Unexpected end of expression");

    // flush
    goto(FLUSH);
    store();


    return res;
};


function compileEs5(tokens, onSelect, insideJsBlock) {

    var code = [];

    tokens.forEach(function (tk) {
        if (typeof tk === 'string') {
            if (!insideJsBlock) {
                code.push(codegen.string(tk, true));
            }
            else {
                code.push(tk);
            }
        } else {
            if (!insideJsBlock && tk.js !== undefined) {
                code.push(compileEs5(tk.js, onSelect, true));

            } else if (tk.s !== undefined) {
                code.push(onSelect(tk.s));
            }
        }
    });

    return code.join(insideJsBlock ? '' : '+');
}

function compile(expression, onSelect, insideJs) {

    var tokens = tokenize(expression);

    return /*es6 ? compileEs6(tokens, scope, config): */ compileEs5(tokens, onSelect, insideJs);


}

module.exports = {

    tokenize: tokenize,
    compile: compile


};