/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */


function ParseError(message) {
    this.name = "ParseError";
    this.message = message ;
}
ParseError.prototype = Error.prototype;

function CompilerError(message) {
    this.name = "CompilerError";
    this.message = message ;
}
CompilerError.prototype = Error.prototype;


module.exports={
    ParseError:ParseError,
    CompilerError:CompilerError
}