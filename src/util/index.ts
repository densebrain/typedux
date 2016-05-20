const log = getLogger(__filename)

export * from './VariableProxy'

/**
 * Is a given value a function
 * 
 * @param o
 * @returns {boolean}
 */
export function isFunction(o:any):o is Function {
	return typeof o === 'function'
}

/**
 * Is array type guard
 *
 * @param o
 */
export function isArray<T>(o:any|Array<T>):o is Array<T> {
	return Array.isArray(o)
}

/**
 * Mark a property as enumerable - or not
 * 
 * @param value
 * @returns {function(any, string, PropertyDescriptor): undefined}
 * @constructor
 */
export function Enumerable(value:boolean) {
	return function (target:any, propertyKey:string, descriptor:PropertyDescriptor) {
		descriptor.enumerable = value
	}
}

export interface SelfTyped<T> {
	new(): T
}

export type NextTickFunction = (callback: Function) => void

function makeNextTick():NextTickFunction {
	let nextTickFn
	try {
		
		nextTickFn = require('process').nextTick.bind(process)
	} catch (err) {
		
	}
	
	if (!nextTickFn) {
		log.debug('In browser, using browser-next-tick')
		nextTickFn = require('browser-next-tick')
	}
	
	return nextTickFn as NextTickFunction
}

export const nextTick = makeNextTick()

/**
 * Retrieve a deep property by string
 * 
 * dot separated .
 * 
 * @param o
 * @param path
 * @param defaultValue
 * @returns {T}
 */
export function getProperty<T>(o:any,path:string,defaultValue:T = null):T {
	const parts = path.split('.')
	let partVal = o
	for (let part of parts) {
		if (!partVal || !(partVal = partVal[part])) {
			return defaultValue
		}
	}
	
	return partVal as T
}