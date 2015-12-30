'use strict';


var assert = require('assert'),
	path = require('path'),
	cp = require('child_process');

var _ = require('lodash');

var exec = cp.exec;

require('../');


describe('hijack require', function () {

	it('performs within a reasonable amount of time (no more than 25% increase in speed)', function (done) {
		// sandboxing benchmark into its own process..
		exec('node ' + path.join(__dirname, '/benchmarks'), function (err, stdout) {
			if (err) {
				throw err;
			}
			var result = JSON.parse(stdout);

			console.log(result);
			assert(((result.preHijacked * 0.25) + result.preHijacked) > result.postHijacked);
			done();
		});
	});

	it('doesn\'t break require on non hijacked modules', function () {
		var os = require('os');
		assert(_.isFunction(os.cpus));
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

describe('hijackFn', function () {

	it('preserves context', function () {
		function TestClass() {
		}

		TestClass.prototype.world = ' world!';

		TestClass.prototype.helloWorld = function () {
			return 'hello';
		};

		var test = new TestClass();

		module.hijackFn(test, 'helloWorld', function () {
			return this.hijacked() + this.world;
		});

		assert(test.helloWorld(), 'hello world!');

	});
});
