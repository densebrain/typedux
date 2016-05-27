
const log = getLogger(__filename)

import {isFunction} from '../util'
import {ActionMessage} from './ActionTypes'
import {Reducer} from '../reducers'
import {ActionFactory} from './ActionFactory'
import {isRecordObject} from 'typemutant'


/**
 * Dispatch an action to the redux store
 *
 * @param dispatch to use
 * @param type of the action to create
 * @param data to add to action
 * @returns {any}
 * @param error
 */


export type ActionOptions = {
	reducers?:Reducer<any,any>[]
	mapped?:string[]
}


/**
 * Method decorator for actions
 *
 * @param options
 * @returns {function(ActionFactory<S, M>, string, PropertyDescriptor): {value: (function(...[any]): any)}}
 * @constructor
 */
export function Action(options:ActionOptions = {}) {

	/**
	 * Decoration used on each instance
	 */
	return function<S extends any,M extends ActionMessage<S>>(target:ActionFactory<S,M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>) {
		const actionCreator = descriptor.value
		const {mapped:argNames, reducers} = options


		// Build arg mapping function
		const mapArgs = (!argNames || argNames.length === 0) ? null : (args) => {
			const data:any = {}
			if (!argNames || argNames.length !== args.length) {
				const msg = `Action descriptor for ${propertyKey}, received no method or argNames length did not match arg length - args = ${(args.join(', '))} 
						- argNames = ${(argNames || []).join(', ')}`
				log.error(msg, args, argNames, propertyKey, descriptor)
				throw new Error(msg)
			}

			argNames.forEach((argName, index) => {
				data[argName] = args[index]
			})

			return data
		}


		// Override the default method
		descriptor.value = function (...args:any[]) {

			// Grab the current dispatcher
			const dispatcher = this.dispatcher

			let data:any = (actionCreator) ? actionCreator.apply(this, args) : {}

			// If we got a function/thunk/promise - return it
			if (isFunction(data))
				return dispatcher(data)

			// If data not returned or this is Mapped - then
			// loop mapped args
			if (argNames) {
				data = mapArgs(args)
			}

			// If no reducers are passed in the map directly to state
			let finalReducers = (reducers) ? [...reducers] : []
			if (finalReducers.length === 0) {
				log.info('Creating mapped handler', propertyKey)
				finalReducers = [(state:S, message:M):S => {
					let stateFn = state[propertyKey]
					if (!stateFn)
						throw new Error(`Unable to find mapped reduce function on state ${propertyKey}`)

					return (isRecordObject(state)) ?  (state.withMutation(tempState => {
						tempState[propertyKey](...args)
						return tempState
					})) : stateFn(...args)
				}]
			}

			// Create the action message -> Dispatch
			const message = this.newMessage(propertyKey, finalReducers,args, data)
			dispatcher(message)
			return message
		}

		return descriptor

	}
}