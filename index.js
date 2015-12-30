'use strict';

// for a good writeup of the node.js module system:
// http://fredkschott.com/post/2014/06/require-and-the-module-system/
var Module = require('module');

var cache = {};

Module.prototype.__origRequire = Module.prototype.require;

Module.prototype.require = function (path) {
	var resolvedPath = Module._resolveFilename(path, this);

	if (cache[resolvedPath]) {

		if (cache[resolvedPath].___uninitialized) {
			cache[resolvedPath].___uninitialized = false;
			cache[resolvedPath] = cache[resolvedPath]();
		}

		return (cache[resolvedPath].___uninitialized === undefined) ? cache[resolvedPath] : this.__origRequire(path);
	}

	return this.__origRequire(path);
};

// hijackRequire
Module.prototype.hijackRequire = function (path, fn) {

	// @TODO do we really have to cause all of these unnecessary errors
	// if the module isn't being required? seems like there has to be a better way
	try {
		var resolvedPath = Module._resolveFilename(path, this);

		cache[resolvedPath] = fn;
		cache[resolvedPath].___uninitialized = true;
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
	}
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
