'use strict';

// for a good writeup of the node.js module system:
// http://fredkschott.com/post/2014/06/require-and-the-module-system/
var Module = require('module');

var hijackedRequireMap = {};

Module.prototype.__origRequire = Module.prototype.require;


Module.prototype.require = function (path) {
	var resolvedPath = Module._resolveFilename(path, this);

	if (hijackedRequireMap[resolvedPath]) {
		return hijackedRequireMap[resolvedPath];
	}
	return this.__origRequire(path);
};

// hijackRequire
Module.prototype.hijackRequire = function (path, fn) {
	var resolvedPath = Module._resolveFilename(path, this);

	hijackedRequireMap[resolvedPath] = fn();
};
