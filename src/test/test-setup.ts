require('babel-polyfill')

//import '../index'
import * as sinonGlobal from 'sinon'
import * as chaiGlobal from 'chai'


declare global {
	var sinon: typeof sinonGlobal
	var expect: typeof chaiGlobal.expect
	var assert: typeof chaiGlobal.assert
	var config:any
}

const g = global as any
g.config = chaiGlobal.config
g.assert = chaiGlobal.assert
g.expect = chaiGlobal.expect
g.sinon = sinonGlobal


export {

}