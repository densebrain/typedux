import {getLogger as LoggerFactory} from 'typelogger'

declare namespace NodeJS {
	interface Global {
		getLogger:typeof LoggerFactory
	}
}
