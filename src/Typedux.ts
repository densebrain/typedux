//const log = require('Log').make('CoreApp');
import {getLogger as LoggerFactory} from 'typelogger'
import * as Reducers from './reducers'
import * as StoreManager from './store/StoreManager'

/**
 * Declare globals
 */
declare global {
	var getLogger:typeof LoggerFactory
}

// Export globals
getLogger = LoggerFactory

export {
	Reducers,StoreManager
}

