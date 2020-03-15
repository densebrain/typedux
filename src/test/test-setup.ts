//import "@babel/polyfill"

//import '../index'
import * as sinonGlobal from 'sinon'
import * as chaiGlobal from 'chai'


declare global {
	const sinon: typeof sinonGlobal
	const expect: typeof chaiGlobal.expect
	const assert: typeof chaiGlobal.assert
	const config:any
}

const g = global as any
g.config = chaiGlobal.config
g.assert = chaiGlobal.assert
g.expect = chaiGlobal.expect
g.sinon = sinonGlobal
g.Promise = require('bluebird')

export {

}
