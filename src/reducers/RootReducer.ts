import Immutable from "immutable"
import {getLogger} from '@3fv/logger-proxy'
import {Action as ReduxAction, Reducer as ReduxReducer} from 'redux'
import type {ObjectAsMap, State} from './State'
import type {ActionMessage} from "../actions"
import type {ILeafReducer} from './LeafReducer'

import {isFunction} from '../util'
// import {getGlobalStateProvider} from '../actions/Actions'
import isEqualShallow from 'shallowequal'

import _get from "lodash/get"
import _clone from "lodash/clone"

import {INTERNAL_ACTION, INTERNAL_ACTIONS} from "../Constants"
import type {ObservableStore} from "../store/ObservableStore"

const
	ActionIdCacheMax = 500,
	log = getLogger(__filename)



/**
 * Get leaf value
 *}
 * @param rootValue
 * @param leaf
 * @return {any}
 */
function getLeafValue<S extends Partial<S> | ObjectAsMap<S>, K, R = (K extends keyof S ? S[K] : unknown)>(rootValue:S, leaf:string):R {
	if (Immutable.isMap(rootValue)) {
		return rootValue.get(leaf)
	} else {
		return _get(rootValue,leaf)
	}
}

/**
 * Error handler type for root reducer
 */
export type RootReducerErrorHandler = (err:Error, reducer?:ILeafReducer<any, any>) => void

/**
 * RootReducer for typedux apps
 *
 * Maps leaf reducers and decorated reducers
 * to the appropriate state functions
 */
export class RootReducer<S extends State> {
	
	// Internal list of all leaf reducers
	private reducers:ILeafReducer<any, ActionMessage<any>>[] = []
	
	// handled actions ids to avoid duplication
	private handledActionIds = []
	
	/**
	 * onError ref, allows an error handler to
	 * be assigned to the reducer
	 */
	public onError:RootReducerErrorHandler
	
	
	/**
	 * Create reducer
	 *
	 * @param rootStateType - type of root state, must be immutable map or record
	 * @param reducers - list of all child reducers
	 */
	constructor(private store: ObservableStore<any>, private rootStateType:{ new():S } = null, ...reducers:ILeafReducer<any, any>[]) {
		const leafs = []
		reducers
			.filter(reducer => isFunction(reducer.leaf))
			.forEach(reducer => {
				const leaf = reducer.leaf()
				if (leafs.includes(leaf)) {
					return
				}
				
				leafs.push(leaf)
				this.reducers.push(reducer)
			})
		
		reducers
			.filter(reducer => !isFunction(reducer.leaf))
			.forEach(reducer => this.reducers.push(reducer))
	}
	
	
	/**
	 * Create default state
	 *
	 * @param defaultStateValue - if provided then its used as base for inflation
	 * @returns {State}
	 */
	defaultState(defaultStateValue:Partial<S> = null):S {
		
		
		// LOAD THE STATE AND VERIFY IT IS Immutable.Map/Record
		let
			state:Partial<S> = defaultStateValue || {type: "ROOT"} as any
		
		
		// ITERATE REDUCERS & CREATE LEAF STATES
		this.reducers
			.filter(reducer => isFunction(reducer.leaf))
			.forEach(reducer => {
				const
					leaf = reducer.leaf(),
					leafDefaultState = getLeafValue(defaultStateValue, leaf)
				
				state = {...state, [leaf]: reducer.defaultState(leafDefaultState || {})}
			})
		
		
		return state as any
	}
	
	/**
	 * Create a generic handler for dispatches
	 *
	 * @returns {(state:S, action:ReduxAction)=>S}
	 */
	makeGenericHandler():ReduxReducer<S> {
		return (state:S, action:ReduxAction):S => this.handle(state, action as ActionMessage<any>) as S
	}
	
	/**
	 * Handle action message
	 *
	 * @param state
	 * @param action
	 * @returns {State}
	 */
	handle(state:S, action:ActionMessage<any>):S {
		
		// Check if action has already been processed
		if (action.id && this.handledActionIds.includes(action.id)) {
			if (typeof console !== 'undefined' && console.trace) {
				console.trace(`Duplicate action received: ${action.leaf}/${action.type}, ${action.id}`, action)
			}
			return state as S
		}
		
		// Push action id to the handled list
		if (action.id) {
			this.handledActionIds.unshift(action.id)
			if (this.handledActionIds.length > ActionIdCacheMax) {
				this.handledActionIds.length = ActionIdCacheMax
			}
		}
		try {
			let hasChanged = false
			
			// Guard state type as immutable
			if (!state) {
				state = this.defaultState(state) as any
				hasChanged = true
			}
			
			const stateMap:State<any> = state as any
			
			// Iterate leafs and execute actions
			let tempState = {...stateMap}
			for (let reducer of this.reducers) {
				if (isFunction(reducer)) {
					const simpleReducer = reducer as any
					const simpleState = simpleReducer(tempState, action)
					if (simpleState !== tempState) {
						tempState = simpleState
						hasChanged = true
					}
					continue
				}
				
				const
					// Get the reducer leaf
					leaf = reducer.leaf(),
					
					// Get Current RAW state
					rawLeafState = tempState[leaf],
					
					// Shape it for the reducer
					startReducerState = rawLeafState
				
				let
					reducerState = startReducerState,
					stateChangeDetected = false
				
				try {
					
					/**
					 * Check the returned state from every handler for changes
					 *
					 * @param newReducerState
					 */
					const checkReducerStateChange = (newReducerState) => {
						if (!newReducerState) {
							throw new Error(`New reducer state is null for leaf ${leaf}`)
						}
						
						
						stateChangeDetected = stateChangeDetected || !isEqualShallow(reducerState, newReducerState)
						reducerState = _clone(newReducerState)
						//log.debug("State change detected",stateChangeDetected)
					}
					
					// Check internal actions
					if (INTERNAL_ACTIONS.includes(action.type)) {
						log.debug(`Sending init event to ${leaf} - internal action received ${action.type}`)
						
						if (INTERNAL_ACTION.INIT === action.type && reducer.init) {
							checkReducerStateChange(reducer.init(startReducerState))
						}
					}
					
					// Check leaf of reducer and action to see if this reducer handles the supplied action
					if (action.leaf && action.leaf !== leaf) {
						continue
					}
					
					// Get the action registration
					const actionReg = this.store?.actions?.getAction(leaf, action.type)
					
					log.debug('Action type supported', leaf, action.type)
					
					// CHECK REDUCER.HANDLE
					if (reducer.handle) {
						checkReducerStateChange(reducer.handle(reducerState, action))
					}
					
					// ActionMessage.reducers PROVIDED
					if (action.stateType && reducerState instanceof action.stateType) {
						_get(action, 'reducers', []).forEach((actionReducer) =>
							checkReducerStateChange(actionReducer(reducerState, action)))
					}
					
					
					// IF @ActionReducer REGISTERED
					if (actionReg && actionReg.options.isReducer) {
						const reducerFn = actionReg.action(null, ...action.args)
						if (!reducerFn || !isFunction(reducerFn)) {
							//noinspection ExceptionCaughtLocallyJS
							throw new Error(`Action reducer did not return a function: ${actionReg.type}`)
						}
						
						log.debug(`Calling action reducer: ${actionReg.fullName}`)
						checkReducerStateChange(reducerFn(reducerState, this.store.getState()))
					}
					
					// CHECK ACTUAL REDUCER FOR SUPPORT
					if (isFunction(reducer[action.type])) {
						checkReducerStateChange(reducer[action.type](reducerState, ...action.args))
					}
					
				} catch (err) {
					log.error(`Error occurred on reducer leaf ${leaf}`, err)
					if (reducer.handleError) {
						reducer.handleError(startReducerState, action, err)
					}
					
					this.onError && this.onError(err, reducer)
				}
				
				if (stateChangeDetected) {
					tempState = {...tempState, [leaf]: reducerState}
					hasChanged = true
				}
			}
			
			
			log.debug('Has changed after all reducers', hasChanged, 'states equal', isEqualShallow(tempState, state))
			return (hasChanged ? tempState : state) as S
			
		} catch (err) {
			log.error('Error bubbled to root reducer', err)
			
			// If error handler exists then use it
			if (this.onError) {
				this.onError && this.onError(err)
				return state as S
			}
			
			// Otherwise throw
			throw err
		}
	}
}

// Export the RootReducer class as the default
export default RootReducer

// export default (state:any,action:any):any => {
// 	return rootReducer.handle(state as DefaultStateType, action as ActionMessage<any>)
// }
