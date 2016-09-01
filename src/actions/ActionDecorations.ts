
import {isFunction} from '../util'
import {ActionMessage} from './ActionTypes'
import {Reducer, State} from '../reducers'
import {ActionFactory} from './ActionFactory'
import {executeActionChain, registerAction, getStoreStateProvider, IActionRegistration} from './Actions'

import {getLogger} from 'typelogger'
const log = getLogger(__filename)

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
	isPromise?:boolean
	isReducer?:boolean
	factory?:any
	reducers?:Reducer<any,any>[]
	mapped?:string[]
}

/**
 * Decorate an action with options provided
 *
 * @param options
 */
function decorateAction(options:ActionOptions = {}) {
	
	// Actual decorator is returned
	return function<S extends State,M extends ActionMessage<S>>(
		target:ActionFactory<S,M>,
		propertyKey:string,
		descriptor:TypedPropertyDescriptor<any>
	) {
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


		let reg:IActionRegistration = null

		// Override the default method
		descriptor.value = function (...preArgs:any[]) {
			return executeActionChain(reg,(...args) => {

				// Grab the current dispatcher
				const dispatcher = this.dispatcher

				let data:any = (actionCreator && !options.isReducer) ?
					actionCreator.apply(this, args) :
					{}



				// If PROMISE function then call it and return it
				if (options.isPromise) {
					return data(dispatcher,getStoreStateProvider())
				}

				// If we got a function/thunk - return it
				if (isFunction(data))
					return dispatcher(data)


				// If data not returned or this is Mapped - then
				// loop mapped args
				if (argNames) {
					data = mapArgs(args)
				}

				// If no reducers are passed in the map directly to state
				let finalReducers = (reducers) ? [...reducers] : []

				// Create the action message -> Dispatch
				const message = this.newMessage(
					this.leaf(),
					propertyKey,
					finalReducers,
					args,
					data
				)
				
				// Dispatch the message
				dispatcher(message)

				return message
			},...preArgs)
		}

		/**
		 * If this is a reducer function, then
		 * register the actual action
		 */
		const actionFn = (options.isReducer) ? actionCreator : descriptor.value

		reg = registerAction(
			target.constructor,
			target.leaf ? target.leaf() : '__typedux',
			propertyKey,
			actionFn,
			options
		)

		return descriptor

	}
}

/**
 * An action that returns a reducer function
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionReducer(options:ActionOptions = {}) {
	return decorateAction(Object.assign({},options,{isReducer:true}))
}



/**
 * Action that returns a promise factory function
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionPromise(options:ActionOptions = {}) {
	return decorateAction(Object.assign({},options,{isPromise:true}))
}

/**
 * Method decorator for actions
 *
 * @param options
 * @returns {function(ActionFactory<S, M>, string, PropertyDescriptor): {value: (function(...[any]): any)}}
 * @constructor
 */
export function Action(options:ActionOptions = {}) {
	return decorateAction(options)
}

