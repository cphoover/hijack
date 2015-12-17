'use strict';


var assert = require('assert'),
	path = require('path'),
	cp = require('child_process');

var _ = require('lodash');

var exec = cp.exec;

require('../');


describe('hijack require', function () {

	it('performs within a reasonable amount of time (no more than 15% increase in speed)', function (done) {
		// sandboxing benchmark into its own process..
		exec('node ' + path.join(__dirname, '/benchmarks'), function (err, stdout) {
			if (err) {
				throw err;
			}
			var result = JSON.parse(stdout);

			console.log(result);
			assert(((result.preHijacked * 0.15) + result.preHijacked) > result.postHijacked);
			done();
		});
	});

	it('works with core module', function () {
		module.hijackRequire('fs', function () {
			var orig = require('fs');

			orig.test = function () {
				return 'test';
			};
			return orig;
		});

		var fs = require('fs');

		assert.equal(fs.test(), 'test');
		assert(_.isFunction(fs.createReadStream));

	});

	it('works with local modules', function () {
		module.hijackRequire('./fixture', function () {
			return {a : 1};
		});
		assert.deepEqual(require('./fixture'), {a : 1});
	});

	it('works with contributed modules', function () {
		module.hijackRequire('lodash', function () {
			var lodash = require('lodash');

			lodash.test = 'test';
			return lodash;
		});
		var lo = require('lodash');

		assert(lo.isEqual(lo.test, 'test'));
	});


});
