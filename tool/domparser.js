/*
 * Clearest Framework
 * Provided under MIT License.
 * Copyright (c) 2012-2015  Illya Kokshenev <sou@illya.com.br>
 */

/**
 *  FIXME: For now, a modified local version of https://github.com/jindw/xmldom
 *  is used. The original version is still quite buggy and lacks some features (such as entity parsing).
 *  As a temporary fix, some tweaks are done directly in to the code.
 */

// TODO: fix xml element name regex to comply wth W3C XML 1.0 spec

var xmldom = require("../thirdparty/xmldom/dom-parser");

module.exports = xmldom.DOMParser;