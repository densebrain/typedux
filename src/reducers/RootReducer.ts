import {getLogger} from 'typelogger'
import {Reducer as ReduxReducer,Action as ReduxAction} from 'redux'
import * as Immutable from 'immutable'
import {State} from './State'
import {ActionMessage} from "../actions"
import {ILeafReducer} from './LeafReducer'

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

/**
 * Error handler type for root reducer
 */
export type RootReducerErrorHandler = (err:Error,reducer?:ILeafReducer<any,any>) => void

export function toJS(o:any) {
	return (o.toJS) ? o.toJS() : o
}

export class RootReducer {

	private reducers:ILeafReducer<any,ActionMessage<any>>[] = []

	public onError:RootReducerErrorHandler

	constructor(...reducers:ILeafReducer<any,any>[]) {
		this.reducers.push(...reducers)
	}


	defaultState():State {
		let state = Immutable.Map<string,any>({})

		this.reducers.forEach((reducer) => {
			const defaultState = reducer.defaultState()
			state = state.set(reducer.leaf(), toJS(defaultState))
		})

		return state
	}

	makeGenericHandler<S extends State>():ReduxReducer<S> {
		return (state:S,action:ReduxAction):S => {
			return this.handle(state,action as ActionMessage<any>) as S
		}
	}

	handle(state:State,action:ActionMessage<any>):State {
		try {
			let hasChanged = false

			if (!state || !stateTypeGuard(state)) {
				state = this.defaultState()
				hasChanged = true
			}

			let nextState = state.withMutations((tempState) => {
				for (let reducer of this.reducers) {
					const leaf = reducer.leaf()

					// Get Current RAW state
					const rawLeafState = tempState.get(leaf)

					// Shape it for the reducer
					const startReducerState = reducer.prepareState(rawLeafState)

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
							//log.debug("State change detected",stateChangeDetected)
						}

						// First check the reducer itself
						checkReducerStateChange((reducer.handle) ?
							reducer.handle(reducerState, action) :
							reducerState)

						// Now iterate the reducers on the message
						if (action.reducers) {
							action.reducers.forEach((actionReducer) => {
								if (action.stateType && reducerState instanceof action.stateType)
									checkReducerStateChange(actionReducer(reducerState, action))
							})
						}


					} catch (err) {
						log.error(`Error occurred on reducer leaf ${leaf}`, err)
						if (reducer.handleError) {
							reducer.handleError(startReducerState, action, err)
						}

						this.onError && this.onError(err,reducer)
					}

					if (stateChangeDetected) {
						tempState.set(leaf, toJS(reducerState))
						hasChanged = true
					}
				}
			})

			log.debug('Has changed after all reducers', hasChanged, 'states equal', nextState === state)
			return hasChanged ? nextState : state

		} catch (err) {
			log.error('Error bubbled to root reducer',err)

			// If error handler exists then use it
			if (this.onError) {
				this.onError && this.onError(err)
				return state
			}

			// Otherwise throw
			throw err
		}
	}
}

export default RootReducer

// export default (state:any,action:any):any => {
// 	return rootReducer.handle(state as DefaultStateType, action as ActionMessage<any>)
// }
