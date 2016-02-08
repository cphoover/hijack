'use strict';

var assert = require('assert'),
	path = require('path'),
	util = require('util'),
	fs = require('fs'),
	cp = require('child_process');

var Bluebird = require('bluebird'),
	request = require('request');

request = Bluebird.promisify(request);

Bluebird.promisifyAll(cp);
Bluebird.promisifyAll(fs);

var _ = require('lodash');

var exec = cp.exec;

var hijack = require('../');

var RUN_SLOW_TESTS = process.env.RUN_SLOW || false; // eslint-disable-line no-process-env

describe('hijack require', function () {

	// slow test...
	if (RUN_SLOW_TESTS) {
		it('will work when used as a dependency from another project', function () {
			var sandboxDestination = '/tmp',
				sandboxLocation = path.join(sandboxDestination, 'hijack-sandbox'),
				destinationModules = path.join(sandboxLocation, 'node_modules');

			var script = [
				util.format('cp -r "%s" "%s";', path.join(__dirname, 'hijack-sandbox', path.sep), sandboxLocation),
				util.format('cp -r "%s" "%s";', path.join(__dirname, '..'), destinationModules),
				util.format('cd %s;', sandboxLocation),
				'node ./test.js;'
			].join('\n');

			this.timeout(50000);
			return cp.execAsync(util.format('mkdir -p "%s"', sandboxLocation))
				.return(script)
				.then(cp.execAsync);

		});
	}


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

	it('won\'t break if the hijacked module hasn\'t been installed', function () {

		function test() {
			hijack.require(module, 'asdf', function () {
				return {};
			});
		}

		assert.doesNotThrow(test);
	});

	it('will still throw if you are trying to incorrectly resolve a module', function () {
		function test() {
			hijack.require(module, {}, function () {
				return {};
			});
		}
		assert.throws(test);
	});

	it('doesn\'t break require on non hijacked modules', function () {
		var os = require('os');

		assert(_.isFunction(os.cpus));
	});

	it('works with core module', function () {
		hijack.require(module, 'fs', function () {
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
		hijack.require(module, './fixture', function () {
			return {a : 1};
		});
		assert.deepEqual(require('./fixture'), {a : 1});
	});

	it('works with contributed modules', function () {
		hijack.require(module, 'lodash', function () {
			var lodash = require('lodash');

			lodash.test = 'test';
			return lodash;
		});
		var lo = require('lodash');

		assert(lo.isEqual(lo.test, 'test'));
	});

	it('works with contributed modules like express', function () {

		function sendRequest() {
			return Bluebird.delay(1000)
				.return('http://localhost:1337/hello')
				.then(request)
				.get('body')
				.tap(console.log);
		}


		function hijackedCallback(req, res) {
			res.send('hey it works!');
		}

		hijack.require(module, 'express', function () {
			var _express = require('express');

			return function () {
				var _app = _express.apply(this, arguments);

				hijack.fn(_app, 'get', function (_path, cb) {
					if (!cb) {
						return this.hijacked(_path);
					}
					return this.hijacked(_path, hijackedCallback);
				});
				return _app;
			};
		});

		var express = require('express');
		var app = express();

		app.get('/hello', function (req, res) {
			res.send(' world!');
		});

		var server = app.listen(1337);

		return sendRequest()
			.then(function (body) {
				assert.equal(body, 'hey it works!');
				server.close();
			});
	});


});

describe('hijackFn', function () {

	it('preserves context', function () {
		function TestClass() {
		}

		TestClass.prototype.world = ' world!';

		function helloWorld() {
			return 'hello';
		}

		helloWorld.blah = 'blah';

		TestClass.prototype.helloWorld = helloWorld;


		var test = new TestClass();

		assert(test.helloWorld.blah === 'blah');

		hijack.fn(test, 'helloWorld', function () {
			return this.hijacked() + this.world;
		});

		assert(test.helloWorld(), 'hello world!');
		assert(test.helloWorld.blah === 'blah');

	});
});
