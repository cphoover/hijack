'use strict';

var blah = require('../blah');

module.hijackRequire(
	'bluebird',
	function () {
		var bluebird = require('bluebird');

		bluebird.hijacked = function () {
			return 'hello world';
		};

		return bluebird;
	}
);

module.exports = 'test';
