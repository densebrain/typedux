const path = require('path')
const fs = require('fs')

const basePath = path.resolve(__dirname)
const distPath = path.resolve(basePath,'dist')
const srcPaths = [
	"./typings/browser.d.ts",
	"./typings/index.d.ts",
	"./src/**/*.ts"
]

const SourceMapModes = {
	SourceMap: 1,
	InlineSourceMap: 2
}

const sourceMapMode = SourceMapModes.InlineSourceMap

const
	gulp = require('gulp'),
	gutil = require('gulp-util'),
	del = require('del'),
	git = require('gulp-git'),
	ts = require('gulp-typescript'),
	glob = require('glob'),
	merge = require('merge2'),
	babel = require('gulp-babel'),
	sourceMaps = require('gulp-sourcemaps')

gulp.task('compile',[],() => {
	const tsProject = ts.createProject('./tsconfig.json',{
		typescript: require('typescript')
	})
	
	const tsResult = gulp
		.src(srcPaths)
		.pipe(sourceMaps.init())
		.pipe(ts(tsProject))


	const sourcemapOpts = {
		sourceRoot: path.resolve(__dirname, 'src'),
		includeContent: false
	}
	
	const sourceMapHandler = (sourceMapMode === SourceMapModes.SourceMap) ?
		// External source maps
		sourceMaps.write('.', sourcemapOpts) :
		// Inline source maps
		sourceMaps.write(sourcemapOpts)

	const finalMerge = merge([
		tsResult.dts.pipe(gulp.dest(distPath)),
		tsResult.js
			.pipe(babel())
			.pipe(sourceMapHandler)
			.pipe(gulp.dest(distPath))
	])

	gutil.log('Merging')

	return finalMerge
})

gulp.task('compile-watch',['compile'],(done) => {
	const watcher = gulp.watch(srcPaths,['compile'])
	watcher.on('change',event => {
		gutil.log("Files Changed: ", event.path)
	})
	watcher.on('error',event => {
		gutil.log(`Received watcher error`,event,config)
	})
})