import {getLogger} from 'typelogger'
import * as Immutable from 'immutable'
import {State} from './State'
import {ActionMessage} from "../actions"
import {ILeafReducer} from './LeafReducer'
//import DocumentationReducer from "./DocumentationReducer"




const log = getLogger(__filename)

/**
 * Ensure the state we get back is still
 * an Immutable.Map
 *
 * @param state
 * @returns {boolean}
 */
function stateTypeGuard(state:any):state is State {
	return (state instanceof Immutable.Map)
}

class RootReducer {

	private reducers:ILeafReducer<any,ActionMessage<any>>[] = []

	constructor(...reducers:ILeafReducer<any,any>[]) {
		this.reducers.push(...reducers)
	}

	private defaultState():State {
		let state = Immutable.Map<string,any>({})

		this.reducers.forEach((reducer) => {
			state = state.set(reducer.leaf(), reducer.defaultState())
		})

		return state
	}

	makeGenericHandler() {
		return (state:State,action:ActionMessage<any>) => {
			return this.handle(state,action)
		}
	}

	handle(state:State,action:ActionMessage<any>) {
		let hasChanged = false

		if (!state || !stateTypeGuard(state)) {
			state = this.defaultState()
			hasChanged = true
		}



		let nextState = state.withMutations((tempState) => {
			for (let reducer of this.reducers) {
				const leaf = reducer.leaf()
				// Get Current state
				const startReducerState = tempState.get(leaf)
				let reducerState = startReducerState
				let stateChangeDetected = false
				try {
					log.debug('Action type supported', leaf, action.type)

					/**
					 * Check the returned state from every handler for changes
					 *
					 * @param newReducerState
					 */
					function checkReducerStateChange(newReducerState) {
						if (!newReducerState)
							throw new Error(`New reducer state is null for leaf ${leaf}`)


						stateChangeDetected = stateChangeDetected || reducerState !== newReducerState
						reducerState = newReducerState
						log.debug("State change detected",stateChangeDetected)
					}

					// First check the reducer itself
					checkReducerStateChange((reducer.handle) ?
						reducer.handle(reducerState,action) :
						reducerState)

					// Now iterate the reducers on the message
					if (action.reducers) {
						action.reducers.forEach((actionReducer) => {
							if (action.stateType && reducerState instanceof action.stateType)
								checkReducerStateChange(actionReducer(reducerState, action))
						})
					}


				} catch (e) {
					log.error(`Error occurred on reducer leaf ${leaf}`,e)
					if (reducer.handleError) {
						reducer.handleError(startReducerState,action,e)
					}
				}

				if (stateChangeDetected) {
					tempState.set(leaf, reducerState)
					hasChanged = true
				}
			}
		})

		log.info('Has changed after all reducers',hasChanged,'states equal',nextState === state)
		return hasChanged ? nextState : state
	}
}

export default RootReducer

// export default (state:any,action:any):any => {
// 	return rootReducer.handle(state as DefaultStateType, action as ActionMessage<any>)
// }
