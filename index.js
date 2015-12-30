'use strict';

// for a good writeup of the node.js module system:
// http://fredkschott.com/post/2014/06/require-and-the-module-system/
var Module = require('module');

var cache = {};

Module.prototype.__origRequire = Module.prototype.require;

Module.prototype.require = function (path) {
	var resolvedPath = Module._resolveFilename(path, this);

	if (cache[resolvedPath]) {

		if (cache[resolvedPath].uninitialized) {
			cache[resolvedPath].uninitialized = false;
			cache[resolvedPath] = cache[resolvedPath]();
		}

		return (cache[resolvedPath].uninitialized === undefined) ? cache[resolvedPath] : this.__origRequire(path);
	}

	return this.__origRequire(path);
};

// hijackRequire
Module.prototype.hijackRequire = function (path, fn) {

	var resolvedPath = Module._resolveFilename(path, this);

	cache[resolvedPath] = fn;
	cache[resolvedPath].uninitialized = true;
};

var originalFn  = 'hijacked',
	originalKey = '__' + originalFn + '__';

Module.prototype.hijackFn = function (object, method, fn) {

	// now when I call object[method] i want to invoke fn from the whatever context it is called with...
	// but with this.hijackedMethod to be set
	object[originalKey + method] = object[method];
	object[method] = function () {
		var self = Object.create(this);

		self[originalFn] = object[originalKey + method];

		return fn.apply(self, arguments);
	};
};
