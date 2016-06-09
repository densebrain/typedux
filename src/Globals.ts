//import 'reflect-metadata'

import {getLogger as LoggerFactory, ILogger} from 'typelogger'
import * as ImmutableGlobal from 'immutable'

/**
 * Declare globals
 *
 * @global getLogger
 */
declare global {
	var getLogger:typeof LoggerFactory
	var Immutable:typeof ImmutableGlobal
}


// Export globals
const g = global as any
Object.assign(g,{
	getLogger: g.getLogger || LoggerFactory,
	Immutable: ImmutableGlobal
})


export { }
