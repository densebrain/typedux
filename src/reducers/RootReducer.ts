import {getLogger} from 'typelogger'
import {Reducer as ReduxReducer,Action as ReduxAction} from 'redux'
import {State} from './State'
import {getAction,ActionMessage} from "../actions"
import {ILeafReducer} from './LeafReducer'
import {Map,Record} from 'immutable'
import {isFunction} from '../util'
import {getStoreStateProvider} from '../actions/Actions'

import {INTERNAL_ACTIONS, INTERNAL_ACTION} from "../Constants"
import * as _get from 'lodash/get'

const
	ActionIdCacheMax = 500,
	log = getLogger(__filename)

/**
 * Ensure the state we get back is still
 * an Immutable.Map
 *
 * @param state
 * @returns {boolean}
 * @param rootStateType
 */
function stateTypeGuard(state:any,rootStateType = null):state is Map<string,any> {
	return (Map.isMap(state) && (rootStateType == null || state instanceof rootStateType))
}


/**
 * Error handler type for root reducer
 */
export type RootReducerErrorHandler = (err:Error,reducer?:ILeafReducer<any,any>) => void

/**
 * RootReducer for typedux apps
 *
 * Maps leaf reducers and decorated reducers
 * to the appropriate state functions
 */
export class RootReducer<S extends State> {

	// Internal list of all leaf reducers
	private reducers:ILeafReducer<any,ActionMessage<any>>[] = []
	
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
	constructor(private rootStateType:{new():S} = null,...reducers:ILeafReducer<any,any>[]) {
		const leafs = []
		reducers.forEach(reducer => {
			const leaf = reducer.leaf()
			if (leafs.includes(leaf))
				return
			
			leafs.push(leaf)
			this.reducers.push(reducer)
		})
		
	}
	
	
	/**
	 * Create default state
	 *
	 * @param defaultStateValue - if provided then its used as base for inflation
	 * @returns {State}
	 */
	defaultState(defaultStateValue:any = null):S {
		
		
		// Create the default state
		let state = this.rootStateType ?
			
			// if provided
			new (this.rootStateType as any)(defaultStateValue || {}) :
			
			// otherwise create map
			Map<string,any>(defaultStateValue || {})

		if (!Map.isMap(state) && !(state instanceof Record)) {
			throw new Error('Even custom rootStateTypes MUST extends ImmutableJS record or map')
		}

		this.reducers.forEach((reducer) => {
			log.info(`Default state for leaf: ${reducer.leaf()}`)
			const leafDefaultStateValue = defaultStateValue &&
				(defaultStateValue.get ?
					defaultStateValue.get(reducer.leaf()) :
					defaultStateValue[reducer.leaf()])
			
			const leafDefaultState = reducer.defaultState(leafDefaultStateValue || {})
			// if (leafDefaultState.set && leafDefaultStateValue) {
			// 	Object.keys(leafDefaultStateValue)
			// 		.forEach(key => leafDefaultState.set(key,leafDefaultStateValue[key]))
			// }
			state = state.set(reducer.leaf(), leafDefaultState)
		})



		return state as any
	}
	
	/**
	 * Create a generic handler for dispatches
	 *
	 * @returns {(state:S, action:ReduxAction)=>S}
	 */
	makeGenericHandler():ReduxReducer<S> {
		return (state:S,action:ReduxAction):S => {
			return this.handle(state,action as ActionMessage<any>) as S
		}
	}
	
	/**
	 * Handle action message
	 *
	 * @param state
	 * @param action
	 * @returns {State}
	 */
	handle(state:S,action:ActionMessage<any>):S {
		
		// Check if action has already been processed
		if (action.id && this.handledActionIds.includes(action.id)) {
			if (typeof console !== 'undefined' && console.trace)
				console.trace(`Duplicate action received: ${action.leaf}/${action.type}, ${action.id}`,action)
			return state as S
		}
		
		// Push action id to the handled list
		if (action.id) {
			this.handledActionIds.unshift(action.id)
			if (this.handledActionIds.length > ActionIdCacheMax)
				this.handledActionIds.length = ActionIdCacheMax
		}
		try {
			let hasChanged = false
			
			// Guard state type as immutable
			if (!state || !stateTypeGuard(state)) {
				state = this.defaultState(state)
				hasChanged = true
			}
			
			const stateMap:Map<string,any> = state as any
			
			// Iterate leafs and execute actions
			let nextState = stateMap.withMutations((tempState) => {
				for (let reducer of this.reducers) {
					const
						// Get the reducer leaf
						leaf = reducer.leaf(),
						
						// Get Current RAW state
						rawLeafState = tempState.get(leaf),
						
						// Shape it for the reducer
						startReducerState = reducer.prepareState(rawLeafState)
					
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
							if (!newReducerState)
								throw new Error(`New reducer state is null for leaf ${leaf}`)
							
							
							stateChangeDetected = stateChangeDetected || reducerState !== newReducerState
							reducerState = newReducerState
							//log.debug("State change detected",stateChangeDetected)
						}
						
						// Check internal actions
						if (INTERNAL_ACTIONS.includes(action.type)) {
							log.info(`Sending init event to ${leaf} - internal action received ${action.type}`)
							
							if (INTERNAL_ACTION.INIT === action.type && reducer.init)
								checkReducerStateChange(reducer.init(startReducerState))
						}
						
						// Check leaf of reducer and action to see if this reducer handles the supplied action
						if (action.leaf && action.leaf !== leaf)
							continue
						
						// Get the action registration
						const actionReg = getAction(leaf,action.type)
						
						log.debug('Action type supported', leaf, action.type)

						// First check the reducer itself
						if (reducer.handle)
							checkReducerStateChange(reducer.handle(reducerState, action))

						// Now iterate the reducers on the message
						if (action.stateType && reducerState instanceof action.stateType)
							_get(action,'reducers',[]).forEach((actionReducer) =>
									checkReducerStateChange(actionReducer(reducerState, action)))
						
						if (actionReg && actionReg.options.isReducer) {
							const reducerFn = actionReg.action(null,...action.args)
							if (!reducerFn || !isFunction(reducerFn)) {
								//noinspection ExceptionCaughtLocallyJS
								throw new Error(`Action reducer did not return a function: ${actionReg.type}`)
							}

							log.info('Calling action reducer: ',actionReg.type)
							checkReducerStateChange(reducerFn(reducerState,getStoreStateProvider()))
						}

						if (isFunction(reducer[action.type])) {
							checkReducerStateChange(reducer[action.type](reducerState,...action.args))
						}
						//NOTE: Removed in favor of new @ActionReducer
						// else if (isFunction(reducerState[action.type])) {
						// 	log.debug('Called reducer directly on state function',action.type)
						// 	const reducerFn = makeMappedReducerFn(action.type,action.args)
						// 	checkReducerStateChange(reducerFn(reducerState,action))
						//
						// 	// const
						// 	// log.debug('Creating mapped handler', propertyKey)
						// 	// finalReducers = [makeMappedReducerFn<S,M>(propertyKey,args)]
						// }

					} catch (err) {
						log.error(`Error occurred on reducer leaf ${leaf}`, err)
						if (reducer.handleError) {
							reducer.handleError(startReducerState, action, err)
						}

						this.onError && this.onError(err,reducer)
					}

					if (stateChangeDetected) {
						tempState.set(leaf, reducerState)
						hasChanged = true
					}
				}
			})

			log.debug('Has changed after all reducers', hasChanged, 'states equal', (nextState as any) === state)
			return (hasChanged ? nextState : state) as S

		} catch (err) {
			log.error('Error bubbled to root reducer',err)

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
