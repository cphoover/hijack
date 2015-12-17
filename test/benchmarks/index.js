'use strict';
// benchmark uncached...
// skip first (which always takes longer (due to disk cache))
require('../fixture');

function runBenchmark(file) {
	var numTests = 1000,
		time,
		diff,
		sum = 0;

	for (var i = 0; i < numTests; i++) {
		delete require.cache[require.resolve(file)];
		time = process.hrtime();
		require(file);
		diff = process.hrtime(time);
		sum = sum + (diff[0] * 1e6 + diff[1] / 1e3);
	}

	var mean = sum / numTests;

	return mean;
}

var preHijacked = runBenchmark('../fixture');

require('../../');

module.hijackRequire('fs', function () {
	var fs =  require('fs');

	fs.test = function () {
		console.log('test');
	};
	return fs;
});

var postHijacked = runBenchmark('../fixture');

var result  = {
	'preHijacked'  : preHijacked,
	'postHijacked' : postHijacked
};

console.log(JSON.stringify(result));
