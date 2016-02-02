'use strict';

// for a good writeup of the node.js module system:
// http://fredkschott.com/post/2014/06/require-and-the-module-system/
var Module = require('module');

var cache = {};

var hijack = {};

Module.prototype.__origRequire = Module.prototype.require;

Module.prototype.require = function (path) {
	// console.log('requireing path', path);
	// console.log('this.id', this.id);
	var resolvedPath = Module._resolveFilename(path, this);

	// console.log('cache', util.inspect(cache, {showHidden: true, depth: 1}));

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
hijack.require = function (mod, path, fn) {

	// @TODO do we really have to cause all of these unnecessary errors
	// if the module isn't being required? seems like there has to be a better way
	try {
		// console.log('hijackRequire this.id', this.id);
		var resolvedPath = Module._resolveFilename(path, mod);

		cache[resolvedPath] = fn;
		cache[resolvedPath].___uninitialized = true;

		// console.log('added to cache: ' + resolvedPath, util.inspect(cache[resolvedPath], {showHidden: true, depth: 1}));
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') {
			throw e;
		}
	}
};

var originalFn  = 'hijacked',
	originalKey = '__' + originalFn + '__';

hijack.fn = function (object, method, fn) {

	// now when I call object[method] i want to invoke fn from the whatever context it is called with...
	// but with this.hijackedMethod to be set
	var originalMethodKey = originalKey + method;
	object[originalMethodKey] = object[method];
	object[method] = function () {
		var self = this;

		self[originalFn] = object[originalKey + method];

		return fn.apply(self, arguments);
	};

	// shim safely by saving all fields
	for (var i in object[originalMethodKey]) {
		if (object[originalMethodKey].hasOwnProperty(i)) {
			object[method][i] = object[originalMethodKey][i]
		}
	}
};

module.exports = hijack;
