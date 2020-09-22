import type {ObservableStore} from "../store/ObservableStore"
import type {Dispatch} from "redux"
import type {State,TRootState} from '../reducers'
import type {ActionOptions} from './ActionDecorations'
import type {ActionMessage} from "./ActionTypes"

import {Option} from "@3fv/prelude-ts"
import {getLogger} from '@3fv/logger-proxy'
import { makeId } from "../util/IdGenerator"
import { InternalState } from "../internal/InternalState"
import { INTERNAL_KEY } from "../Constants"




// const
// 	_cloneDeep = require('lodash.cloneDeep')

const
	log = getLogger(__filename)

// Internal type definition for
// function that gets the store state
export type GetStoreState<S extends State = any> = () => S
export type DispatchState<A extends ActionMessage<any> = any> = Dispatch<A>
export type ActionFactoryDecorator<T> = (factory:{new():T}) => T

export interface ActionRegistration {
	paramTypes?:any[]
	type:string
	fullName:string
	leaf:string
	action:Function
	options:ActionOptions
	actionFactory:any
}

export interface ActionInterceptorNext {
	():any
}

export interface ActionInterceptor {
	(reg:ActionRegistration, next:ActionInterceptorNext, ...args:any[]):any
}




let globalStore: ObservableStore<any>
// /**
//  * Reference to a dispatcher
//  */
// let dispatch:DispatchState
//
// /**
//  * Reference to store state
//  */
// let getStoreState:GetStoreState

export const getGlobalStore = () => globalStore

export const getGlobalStoreState = () => getGlobalStore()?.getState()

const globalDispatchProvider = (<A extends ActionMessage<any>>(action: A) => Option.ofNullable(globalStore)
	.map(store => store.dispatch(action))
	.getOrThrow(`Invalid store`)) as Dispatch<any>



/**
 * Get the current store state get
 * function - usually set when a new state is created
 *
 * @returns {GetStoreState}
 */
export function getGlobalStateProvider<S extends State = any>():GetStoreState<S> {
	return getGlobalStoreState
}

/**
 * Get the current store
 * dispatch function
 *
 * @returns {DispatchState}
 */
export function getGlobalDispatchProvider():DispatchState {
	return globalDispatchProvider
}

/**
 * Get the stores internal state
 *
 * @returns {GetStoreState|any}
 */
export function getGlobalStoreInternalState():InternalState {
	return getGlobalStoreState && (getGlobalStoreState() as TRootState)[INTERNAL_KEY] as any
}

/**
 * Set the global store provider
 *
 * @param newStore
 */
export function setGlobalStore<S extends ObservableStore<any>>(newStore: S) {
	if (!newStore && process.env.NODE_ENV === "development") {
		console.warn(`You are setting the global store to null`)
	}

	// Cast the guarded type
	globalStore = newStore

}

export class ActionContainer {
	registeredActions:{[actionType:string]:ActionRegistration} = {}
	
	actionInterceptors:ActionInterceptor[] = []

	constructor(public store: ObservableStore<any> ) {
	
	}

/**
 * Add an interceptor
 *
 * @param interceptor
 * @returns {()=>undefined}
 */
addActionInterceptor(interceptor:ActionInterceptor) {
	const {actionInterceptors} = this
	actionInterceptors.push(interceptor)

	return () => {
		const index = actionInterceptors.findIndex(o => interceptor === o)
		if (index > -1)
			actionInterceptors.splice(index,1)
	}
}

/**
 * Execute an interceptor at a specific index
 *
 * @param index
 * @param reg
 * @param actionId
 * @param action
 * @param args
 * @returns {any}
 */
executeActionInterceptor(
	index:number,
	reg:ActionRegistration,
	actionId:string,
	action:Function,
	args:any[]
) {
	const {actionInterceptors, store} = this

	if (actionInterceptors.length > index) {
		return actionInterceptors[index](reg,() => {
			return this.executeActionInterceptor(
				index + 1,
				reg,
				actionId,
				action,
				args
			)
		},...args)
	} else {
		return action(actionId,...args)
	}
}

/**
 * Execute a given action chain
 *
 * @param reg
 * @param actionFn
 * @param args
 * @returns {any|any}
 */
executeActionChain(reg:ActionRegistration, actionFn:Function, ...args:any[]) {
	return this.executeActionInterceptor(0,reg,makeId(),actionFn,args)
}



/**
 * Create a fully qualified action type
 *
 * @param leaf
 * @param type
 *
 * @returns {string}
 */
makeLeafActionType(leaf:string,type:string) {
	return type.indexOf('.') > -1 ? type : `${leaf}.${type}`
}

/**
 * Register an action from a decoration usually
 *
 * @param actionFactory
 * @param leaf
 * @param type
 * @param action
 * @param options
 */

registerAction(actionFactory:any,leaf:string,type:string,action:Function,options:ActionOptions):ActionRegistration {
	const reg = {
		type,
		fullName: this.makeLeafActionType(leaf,type),
		leaf,
		options,
		actionFactory,
		action: (decorator:ActionFactoryDecorator<any>,...args) => {
			let actions = (decorator) ? decorator(actionFactory) : null
			if (!actions) {
				const newFactory = options.factory || actionFactory
				actions =  new newFactory()
			}


			return action.apply(actions,args)
		}
	}
	this.registeredActions[reg.fullName] = reg

	return reg
}


/**
 * Retrieve a registered leaf action
 *
 * @param leaf
 * @param type
 * @returns {ActionRegistration}
 */
getAction(leaf:string,type:string):ActionRegistration {
	return this.registeredActions[this.makeLeafActionType(leaf,type)]
}


getAllActions() {
	return this.registeredActions // _cloneDeep(registeredActions)
}


}
