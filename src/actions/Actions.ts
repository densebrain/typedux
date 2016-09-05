


import {Store,Dispatch} from 'redux'
import {State} from '../reducers'
import {getLogger} from 'typelogger'
import {ActionOptions} from './ActionDecorations'


const
	uuid = require('node-uuid'),
	log = getLogger(__filename)

// Internal type definition for
// function that gets the store state
export type GetStoreState = () => State
export type DispatchState = Dispatch<State>

export interface IActionRegistration {
	paramTypes?:any[]
	type:string
	fullName:string
	leaf:string
	action:Function
	options:ActionOptions
	actionFactory:any
}

export interface IActionInterceptorNext {
	():any
}

export interface IActionInterceptor {
	(reg:IActionRegistration,next:IActionInterceptorNext,...args:any[]):any
}

let registeredActions:{[actionType:string]:IActionRegistration} = {}

let actionInterceptors:IActionInterceptor[] = []

/**
 * Reference to a dispatcher
 */
let dispatch:DispatchState

/**
 * Reference to store state
 */
let getStoreState:GetStoreState

/**
 * Get the current store state get
 * function - usually set when a new state is created
 *
 * @returns {GetStoreState}
 */
export function getStoreStateProvider():GetStoreState {
	return getStoreState
}

/**
 * Get the current store
 * dispatch function
 *
 * @returns {DispatchState}
 */
export function getStoreDispatchProvider():DispatchState {
	return dispatch
}

/**
 * Set the global store provider
 *
 * @param newDispatch
 * @param newGetState
 */
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
 * Add an interceptor
 *
 * @param interceptor
 * @returns {()=>undefined}
 */
export function addActionInterceptor(interceptor:IActionInterceptor) {
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
function executeActionInterceptor(
	index:number,
	reg:IActionRegistration,
	actionId:string,
	action:Function,
	args:any[]
) {
	if (actionInterceptors.length > index) {
		return actionInterceptors[index](reg,() => {
			return executeActionInterceptor(
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
export function executeActionChain(reg:IActionRegistration,actionFn:Function,...args:any[]) {
	return executeActionInterceptor(0,reg,uuid.v4(),actionFn,args)
}

export type ActionFactoryDecorator<T> = (factory:{new():T}) => T

/**
 * Create a fully qualified action type
 *
 * @param leaf
 * @param type
 *
 * @returns {string}
 */
export function makeLeafActionType(leaf:string,type:string) {
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

export function registerAction(actionFactory:any,leaf:string,type:string,action:Function,options:ActionOptions):IActionRegistration {
	const reg = {
		type,
		fullName: makeLeafActionType(leaf,type),
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
	registeredActions[reg.fullName] = reg

	return reg
}


/**
 * Retrieve a registered leaf action
 *
 * @param leaf
 * @param type
 * @returns {IActionRegistration}
 */
export function getAction(leaf:string,type:string):IActionRegistration {
	return registeredActions[makeLeafActionType(leaf,type)]
}

