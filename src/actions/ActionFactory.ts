

import {Enumerable,SelfTyped} from '../util'
import {ActionMessage} from './ActionTypes'
import {Action} from './ActionDecorations'
import {getStoreStateProvider,getStoreDispatchProvider} from './Actions'
import {getLogger} from 'typelogger'
import {Reducer, State} from '../reducers'
const log = getLogger(__filename)

/**
 * Base class for action implementations for a given state
 *
 */
export abstract class ActionFactory<S extends State,M extends ActionMessage<S>> {

	private _dispatcher:Function
	private _getState:Function
	stateType:any

	/**
	 * Create a new action factory that consumes and produces a specific
	 * state type
	 *
	 * @param stateType
	 */
	constructor(stateType:{new(): S}) {
		log.debug(`Created action factory with state type: ${stateType.name}`)
		this.stateType = stateType
	}

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
		const dispatch = getStoreDispatchProvider()

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
		const getStoreState = getStoreStateProvider()
		const state = (this._getState) ? this._getState() :
			(getStoreState) ? getStoreState() : null

		if (!state) return null

		const leaf = this.leaf()

		const stateValue = leaf ? state.get(leaf) : state
		if (this.stateType.recordType && stateValue instanceof this.stateType.recordType) {
			return this.stateType.fromJS(stateValue)
		} else {
			return ((leaf) ? state.get(leaf) : state) as S
		}
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
	 * @returns {*|({leaf: string, type: string, reducers: Reducer<any, ActionMessage<any>>[], stateType: any}&{}&{args: Array})|any}
	 * @param leaf
	 */
	newMessage(
		leaf:string,
		type:string,
		reducers:Reducer<S,ActionMessage<S>>[] = [],
		args:any[] = [],
		data = {}
	):M {
		return Object.assign({
			leaf,
			type,
			reducers,
			args,
			stateType: this.stateType
		},data) as any
	}

	/**
	 * setError action applies to all states
	 *
	 * @param error
	 */
	@Action()
	setError(error:Error) {

	}


}

