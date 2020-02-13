import {getLogger} from 'typelogger'

import {Reducer as ReduxReducer, Action as ReduxAction} from 'redux'
import {State} from './State'
import {getAction, ActionMessage} from "../actions"
import {ILeafReducer} from './LeafReducer'

import {isFunction} from '../util'
import {getStoreStateProvider} from '../actions/Actions'
import * as isEqualShallow from 'shallowequal'
import {INTERNAL_ACTIONS, INTERNAL_ACTION} from "../Constants"

const
	_ = require('lodash')

const
	ActionIdCacheMax = 500,
	log = getLogger(__filename)


/**
 * Get leaf value
 *
 * @param rootValue
 * @param leaf
 * @returns {any|T|undefined|V|string|IDBRequest}
 */
function getLeafValue(rootValue, leaf:string) {
	return rootValue &&
		(rootValue.get ?
			rootValue.get(leaf) :
			rootValue[leaf])
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
export class RootReducer<S extends State<any>> {
	
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
	constructor(private rootStateType:{ new():S } = null, ...reducers:ILeafReducer<any, any>[]) {
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
	defaultState(defaultStateValue:any = null):S {
		
		
		// LOAD THE STATE AND VERIFY IT IS Immutable.Map/Record
		let
			state = defaultStateValue || {type: "ROOT"} as State<any>
		
		
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
				state = this.defaultState(state)
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
						reducerState = _.clone(newReducerState)
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
					const actionReg = getAction(leaf, action.type)
					
					log.debug('Action type supported', leaf, action.type)
					
					// CHECK REDUCER.HANDLE
					if (reducer.handle) {
						checkReducerStateChange(reducer.handle(reducerState, action))
					}
					
					// ActionMessage.reducers PROVIDED
					if (action.stateType && reducerState instanceof action.stateType) {
						_.get(action, 'reducers', []).forEach((actionReducer) =>
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
						checkReducerStateChange(reducerFn(reducerState, getStoreStateProvider()))
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
