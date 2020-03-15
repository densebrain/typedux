

import {Enumerable,SelfTyped} from '../util'
import {ActionMessage} from './ActionTypes'
import {ActionThunk} from './ActionDecorations'
import {getStoreStateProvider,getStoreDispatchProvider,makeLeafActionType} from './Actions'
import {getLogger} from "typelogger"
import {Reducer, State} from '../reducers'
import {Store} from "redux"


const
	uuid = require('uuid/v4'),
	log = getLogger(__filename)


export interface IActionFactoryConstructor<S extends State<any>> {
	new ():ActionFactory<S,ActionMessage<S>>
}

/**
 * Base class for action implementations for a given state
 *
 */
export abstract class ActionFactory<S extends State<any>,M extends ActionMessage<S>> {

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

	static newWithDispatcher<S extends State<any>,A extends ActionFactory<S,ActionMessage<S>>>
	(actionClazz:{new ():A}, newDispatcher:Function, newGetState?:Function):A {
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

		if (!this._dispatcher && !dispatch) {
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
		return ((leaf) ? state[leaf] : state) as S
		// const stateValue = leaf ? state[leaf] : state
		// if (this.stateType.recordType && stateValue instanceof this.stateType.recordType) {
		// 	return this.stateType.fromJS(stateValue)
		// } else {
		//
		// }
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
	 * Set the store for action factory
	 *
	 * @param newStore
	 */
	setStore(newStore:Store<State<any>>) {
		const dispatch = newStore.dispatch.bind(newStore)
		const getStoreState = newStore.getState.bind(newStore)
		
		this._dispatcher = dispatch
		this._getState = getStoreState
	}

	/**
	 * Create a new action message object that
	 * fits the shape defined by the generic M
	 *
	 * @param id
	 * @param type
	 * @param reducers
	 * @param data
	 * @param args
	 * @param leaf
	 */
	
	
	newMessage(
		id:string,
		leaf:string,
		type:string,
		reducers:Reducer<S,ActionMessage<S>>[] = [],
		args:any[] = [],
		data = {}
	):M {
		return Object.assign({
			id: id || uuid(),
			leaf,
			type: makeLeafActionType(this.leaf(),type),
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
	@ActionThunk()
	setError(error:Error) {

	}


}

