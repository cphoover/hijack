'use strict';

var gulp           = require('gulp'),
	istanbul       = require('gulp-istanbul'),
	lintspaces     = require('gulp-lintspaces'),
	eslint         = require('gulp-eslint'),
	mocha          = require('gulp-mocha'),
	lintspacesrc   = require('ua-lintrc/lintspaces'),
	eslintrc       = require('ua-lintrc/eslint'),
	mochalintrc    = require('ua-lintrc/mochalint'),
	spacesindentrc = require('ua-lintrc/spaceindent'),
	getSrcDirs     = require('ua-gulp-src-entries'),
	_              = require('lodash');


var IGNORE_ITEMS = ['node_modules', 'coverage', 'prod_import/node_modules', 'ci.json'];

var topLevelDirs = getSrcDirs(IGNORE_ITEMS, __dirname);

var config = {
	coverage : {
		statements : 80,
		branches   : 80,
		functions  : 80,
		lines      : 80
	},
	paths: {
		js: [
			'*.js',
			topLevelDirs + '/**/*.js',
			'!**/*.test.js'
		],
		test: [
			'*.test.js',
			topLevelDirs + '/**/*.test.js',
			'!contract-tests/**/*'
		],
		contract: [
			'contract-tests/**/*.test.js'
		],
		whitespace: [
			'*.*',
			topLevelDirs + '/**/*.*',
			'!**/package.json',
			'!**/ci.json',
			'!**/*.yaml',
			'!prod_import/**/*.*'
		],
		packagejson: [
			'package.json',
			'ci.json',
			'proto/package.json'
		]
	}
};

function onError(e) {
	throw e;
}

function CheckCoverage() {
	function checkTypeCoverage(v, k) {
		return config.coverage[k] > v.pct;
	}

	var failedCoverage = _.some(istanbul.summarizeCoverage(),
		checkTypeCoverage);

	if (failedCoverage) {
		this.emit('error',
			new Error('Inadequate test coverage'));
	}
}

gulp.task('lint:whitespace', function lintWhitespace() {
	return gulp.src(config.paths.whitespace)
		.pipe(lintspaces(lintspacesrc))
		.pipe(lintspaces.reporter())
		.on('error', onError);
});

gulp.task('lint:package', function lintWhitespace() {
	return gulp.src(config.paths.packagejson)
		.pipe(lintspaces(spacesindentrc))
		.pipe(lintspaces.reporter())
		.on('error', onError);
});

gulp.task('lint:js', function lintJS() {
	return gulp.src(config.paths.js)
		.pipe(eslint(eslintrc))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
		.on('error', onError);
});

gulp.task('lint:tests', function lintTests() {
	return gulp.src(config.paths.test)
		.pipe(eslint(mochalintrc))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError())
		.on('error', onError);
});

gulp.task('mocha', function mochaRun(cb) {
	gulp.src(config.paths.js)
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', function runTests() {
			gulp.src(config.paths.test)
				.pipe(mocha())
				.pipe(istanbul.writeReports())
				.on('end', CheckCoverage)
				.on('end', cb)
				.on('error', onError);
		});
});

gulp.task('contract', function contractTests() {
	return gulp.src(config.paths.contract)
		.pipe(mocha())
		.on('error', onError);
});

gulp.task('lint', ['lint:whitespace', 'lint:package', 'lint:js', 'lint:tests']);
gulp.task('test', ['lint', 'mocha']);
gulp.task('default', ['test']);
