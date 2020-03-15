
var path = require('path')
var fs = require('fs')

module.exports = function (wallaby) {




	return {
		projectRoot: __dirname,

		/**
		 * Regular modules
		 */
		files: [
			'typings/browser.d.ts',
			'src/**/*.ts',
			'!src/**/*.spec.ts',
			{ pattern: 'src/test/fixtures/*.ts', instrument:false }
		],


		/**
		 * Tests
		 */
		tests: [
			'src/**/*.spec.ts'
		],

		// Mocha
		testFramework: "mocha",

		env: {
			type: 'node'
			// ,
			// params: {
			// 	env:'DEBUG=true;NODE_PATH=' + nodePath
			//}
		},

		// In order to get everything to work it has to
		// go through babel - this needs to be fixed at somepont
		compilers: {
			'**/*.ts': wallaby.compilers.typeScript({
				typescript: require('typescript'),
				module: 5,  // ES6
				target: 2,  // ES6
				emitDecoratorMetadata: true,
				experimentalDecorators: true,
				preserveConstEnums: true,
				allowSyntheticDefaultImports: true,
				jsx: 'react'
			})
		},
		preprocessors: {
			'**/*.js': file => {
				return require('babel-core')
					.transform(
						file.content,
						JSON.parse(fs.readFileSync('./.babelrc','utf-8'))
					)
			}
		},

		delays: {
			edit: 500,
			run: 150
		},

		workers: {
			initial: 1,
			regular: 1
		},

		// Override the global Promise
		bootstrap: function() {
			var path = require('path')
			var mochaPath = path.join(wallaby.localProjectDir, 'src','test','mocks','test-setup')
			//console.log('mocha path', mochaPath)
			global.assert = require('assert')
			require('./src/test/mocks/test-setup')

		}
	}
}