// declare global {
// 	const sinon: typeof sinonGlobal
// 	const expect: typeof chaiGlobal.expect
// 	const assert: typeof chaiGlobal.assert
// 	const config:any
// }
//

// g.config = chaiGlobal.config
// g.assert = chaiGlobal.assert
// g.expect = chaiGlobal.expect
// g.sinon = sinonGlobal

const g = global as any
g.Promise = require('bluebird')

export {

}
