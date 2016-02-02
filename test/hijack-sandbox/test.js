'use strict';

var assert = require('assert');

require('hijack-require');

var bulk = require('bulk-require');

var api = bulk(__dirname, ['probes/*_probe.js']);

var bluebird = require('bluebird');

assert(typeof bluebird.resolve === 'function');
assert(typeof bluebird.hijacked === 'function');
assert(api.probes.bluebird_probe === 'test');
