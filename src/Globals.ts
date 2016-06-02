import 'reflect-metadata'

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
Object.assign(global as any,{
	getLogger: LoggerFactory,
	Immutable: ImmutableGlobal
})


export { }
