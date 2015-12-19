/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

module.exports = {
    SYMBOL: {
        $context: "$context",
        aggregator: "\u01A9", // symbol used for aggregator call
        api: "\u03A0", // symbol used for api call
        empty: "{}"
    },
    API: {
        inject:".inj",
        count: ".cnt",
        select: ".sel",
        get: ".get",
        on: ".on",
        observe: ".obs",
        control: ".ctl",
        use: ".use",
        widget: ".wid",
        depend: ".dep",
        start:".start" // used only for bootstrapping from static context
    }
};