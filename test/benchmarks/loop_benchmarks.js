'use strict';

var path = require('path');

var exec = require('child_process').exec;

var numRuns = 1000;

function run(filename) {
	var loopCount = 0;

	var benchmarkSum = 0;

	function loopBenchmark() {
		exec('node ' + filename, function (error, stdout) {
			if (error) {
				console.error(error);
			}
			loopCount++;
			if (loopCount < numRuns) {
				// console.log('microseconds', stdout);
				benchmarkSum += parseFloat(stdout);
				loopBenchmark();
			}	else {
				console.log('****************************');
				console.log('mean time:' + filename + ':' + (benchmarkSum / numRuns));
				console.log('****************************');
			}
		});
	}

	loopBenchmark();
}

run(path.join(__dirname, '/benchmark_hijacked.js'));
run(path.join(__dirname, '/benchmark_require.js'));
