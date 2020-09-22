import type {ObservableStore} from "../store"

import {Option} from "@3fv/prelude-ts"
import {Enumerable, isNotEmpty} from '../util'
import {ActionMessage} from './ActionTypes'
import {ActionThunk} from './ActionDecorations'
import {getGlobalStore, makeLeafActionType} from './Actions'
import {getLogger} from '@3fv/logger-proxy'
import {Reducer, State, StateConstructor} from '../reducers'
import {Action, Dispatch, Store} from "redux"
import * as ID from "shortid"
import {isFunction} from "@3fv/guard"
import {isMap} from "immutable"

const
	log = getLogger(__filename)


export interface ActionFactoryConstructor<Clazz extends ActionFactory<any,any>, S extends Clazz["state"] = Clazz["state"]> {
	
	setStore: (store: ObservableStore<any>) => void
	
	new ():Clazz
}

/**
 * Base class for action implementations for a given state
 *
 */
export abstract class ActionFactory<S extends State<any>,M extends ActionMessage<S>> {
	
	protected static clazzStore: ObservableStore<any>
	
	static setStore(newClazzStore: ObservableStore<any>) {
		this.clazzStore = newClazzStore
	}
	
	// protected readonly _dispatcher:Function
	//protected readonly _getState:Function
	
	protected store: ObservableStore<any>
	
	readonly stateType:StateConstructor<S>

	/**
	 * Create a new action factory that consumes and produces a specific
	 * state type
	 *
	 * @param stateType
	 * @param withStore
	 */
	protected constructor(stateType:StateConstructor<S>, withStore: ObservableStore<any> = undefined) {
		log.debug(`Created action factory with state type: ${stateType.name}`)
		this.stateType = stateType
		this.store = withStore
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

	static newWithStore<S extends State<any>,A extends ActionFactory<S,ActionMessage<S>>>
	(newStore: ObservableStore<any>):A {
		const instance = new (<any>this.constructor)
		
		instance.store = newStore
		
		return instance
	}

	getStore() {
		return this.store ?? ActionFactory.clazzStore ?? getGlobalStore()
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
	get dispatcher(): Dispatch<any> {
		const store = this.getStore()

		if (!store || !isFunction(store.dispatch)) {
			throw new Error("Global dispatcher must be set before any actions occur")
		}


		return (<A extends Action>(action: A) => store.dispatch<A>(action)) as Dispatch<any>
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
		const store = this.getStore()
		//const getStoreState = getGlobalStateProvider()
		const state = store?.getState()

		if (!state)
			return null

		const leaf = this.leaf()
		return !leaf ? state : isMap(state) ? state.get(leaf) : state[leaf]
	}


	/**
	 * withDispatcher creates a new instance of
	 * this action implementation with a
	 * new dispatcher and optionally a new
	 * getState
	 *
	 * @returns {any}
	 * @param newStore
	 */
	withStore(newStore:ObservableStore<any>):this {
		let instance = new (<any>this.constructor)

		instance.store = newStore
		
		return instance

	}
	
	/**
	 * Set the store for action factory
	 *
	 * @param newStore
	 * @return {this<S, M>}
	 */
	setStore(newStore:ObservableStore<any>) {
		this.store = newStore
		
		return this
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
			id: Option.ofNullable(id)
				.filter(isNotEmpty)
				.getOrCall(() => ID.generate()),
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

