const log = getLogger(__filename)

import {isFunction,Enumerable,SelfTyped} from '../util'
import {Store,Dispatch} from 'redux'
import {ActionMessage} from './ActionTypes'
import {State,Reducer} from '../reducers'


// Internal type definition for 
// function that gets the store state
type GetStoreState = () => State
type DispatchState = Dispatch<State>

/**
 * Reference to a dispatcher
 */
let dispatch:DispatchState

/**
 * Reference to store state
 */
let getStoreState:GetStoreState

export function setStoreProvider(newDispatch:DispatchState|Store<State>,newGetState?:GetStoreState) {
	if (newGetState) {
		dispatch = newDispatch as DispatchState
		getStoreState = newGetState
	} else if (<Store<State>>newDispatch) {
		
		// Cast the guarded type
		const newStore = <Store<State>>newDispatch
		
		// Set and bind
		dispatch = newStore.dispatch.bind(newDispatch)
		getStoreState = newStore.getState.bind(newDispatch)
	}

	if (!dispatch || !getStoreState)
		throw new Error('Set store provider must include both dispatch and getState')
}

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
	reducers?:Reducer<State>[]
	mapped?:string[]
}


/**
 * Method decorator to descript actions
 *
 * @param options
 * @returns {function(ActionFactory<S, M>, string, PropertyDescriptor): {value: (function(...[any]): any)}}
 * @constructor
 */
export function ActionDescriptor(options:ActionOptions = {}) {
	
	return function<S extends State,M extends ActionMessage<S>>(target:ActionFactory<S,M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>) {
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
			const dispatcher = target.dispatcher

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
					const stateFn = state[propertyKey]
					if (!stateFn)
						throw new Error(`Unable to find mapped reduce function on state ${propertyKey}`)

					return stateFn.apply(state, args)
				}]
			}

			// Create the action message -> Dispatch
			const message = target.newMessage(propertyKey, finalReducers,args, data)
			dispatcher(message)
			return message
		}

		return descriptor

	}
}

/**
 * Base class for action implementations for a given state
 *
 */
export abstract class ActionFactory<S extends State,M extends ActionMessage<S>> {

	private _dispatcher:Function
	private _getState:Function


	/**
	 * Create a new action factory that consumes and produces a specific
	 * state type
	 *
	 * @param stateType
	 */
	constructor(public stateType:{new(): S}) { }

	/**
	 * Create a new actions instance using a
	 * specific dispatcher
	 *
	 * @param actionClazz
	 * @param newDispatcher
	 * @param newGetState
	 * @returns {T}
	 */

	static newWithDispatcher<T extends ActionFactory<any,any>>(actionClazz:SelfTyped<T>, newDispatcher:Function, newGetState?:Function):T {
		return (new actionClazz()).withDispatcher(newDispatcher, newGetState)
	}

	/**
	 * The leaf served by this implementation
	 */
	abstract leaf():string



	/**
	 * Get the current dispatcher
	 *
	 * Implemented for the purpose of thunks
	 * etc where the dispatcher can be augmented
	 *
	 * @returns {Function|(function(any): any)}
	 */

	@Enumerable(false)
	get dispatcher():Function {
		if (!dispatch) {
			throw new Error("Global dispatcher must be set before any actions occur")
		}


		return this._dispatcher || dispatch
	}

	/**
	 * Retrieve the current state using the global
	 * getState or the augmented one
	 *
	 * directly applicable to @see dispatcher
	 *
	 * @returns instance of the state supported by this factory
	 */
	get state():S {
		const state = (this._getState) ? this._getState() :
			(getStoreState) ? getStoreState() : null

		if (!state) return null

		const leaf = this.leaf()

		return ((leaf) ? state.get(leaf) : state) as S
	}


	/**
	 * withDispatcher creates a new instance of
	 * this action implementation with a
	 * new dispatcher and optionally a new
	 * getState
	 *
	 * @param newDispatcher
	 * @param newGetState
	 * @returns {ActionFactory}
	 */
	withDispatcher(newDispatcher:Function, newGetState?:Function):this {
		let instance = new (<any>this.constructor)

		instance._dispatcher = newDispatcher
		instance._getState = newGetState
		return instance

	}

	/**
	 * Create a new action message object that
	 * fits the shape defined by the generic M
	 *
	 * @param type
	 * @param reducers
	 * @param data
	 * @param args
	 * @returns {M}
	 */
	newMessage(type:string, reducers = [],args = [], data = {}):M {
		const messageObject = {
			type,
			reducers, 
			stateType: this.stateType
		} as M
		
		Object.assign(messageObject, data,{args})
		
		return messageObject
	}

	/**
	 * setError action applies to all states
	 *
	 * @param error
	 */
	@ActionDescriptor()
	setError(error:Error) {
		
	}


}


