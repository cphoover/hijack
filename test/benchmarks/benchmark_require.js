'use strict';

// benchmark uncached...
var time = process.hrtime();

require('fs');
var diff = process.hrtime(time);

console.log(diff[0] * 1e6 + diff[1] / 1e3);
