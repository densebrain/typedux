import {getLogger} from 'typelogger'
import {Middleware,Store,Reducer,applyMiddleware,Unsubscribe,Action} from 'redux'
import {isFunction} from '../../util'

/**
 * Slightly extended Store interface for
 * easier testing
 */
export interface MockStore<S> extends Store<S> {
	setState(newState)
	getActions()
	getReducer:Reducer<S>
	clearActions()
}

/**
 * Shape of the factory used to build stores
 */
export interface MockStoreFactory {
	(fromState:any,storeReducer?:any,onStateChange?:Function,storeMixins?:any):MockStore<any>
}

/**
 * Create a new factory with the provided middlewares
 * to generate stores
 *
 * @param middlewares to install in the mock store
 * @returns {MockStoreFactory}
 */
function mockStoreFactory(middlewares:Middleware[]):MockStoreFactory {
	return function(fromState:any,storeReducer = null,onStateChange:Function = null,storeMixins:any = null):MockStore<any> {

		// First calculate the store state if a function was provided
		let storeState = (isFunction(fromState)) ? fromState() : fromState

		function makeStore() {
			let actions = []

			const store:MockStore<any> = {

				getState():any {
					return storeState
				},

				setState(newState) {
					storeState = newState
				},

				getActions() {
					return actions;
				},

				dispatch<A extends Action>(action:A):A {
					actions.push(action);

					const newStoreState = (storeReducer) ?
						storeReducer(storeState,action) :
						storeState

					// If the state changed then set and notify
					if (newStoreState !== storeState) {
						storeState = newStoreState
						if (onStateChange)
							onStateChange(newStoreState)
					}

					return action
				},

				clearActions() {
					actions = [];
				},

				subscribe(listener:() => void):Unsubscribe {
					return () => {
						//unsubscribe
					};
				},

				getReducer() {
					return storeReducer
				},
				replaceReducer(newReducer:Reducer<any>) {
					storeReducer = newReducer
				}
			}

			if (storeMixins)
				Object.assign(store, storeMixins)

			return store
		}

		if (middlewares.length) {
			const addMiddleware = applyMiddleware(...middlewares)(makeStore)
			return addMiddleware(storeReducer,fromState) as any
		} else {
			return makeStore()
		}
	}
}

export function configureMockStore(...middlewares:Middleware[]) {
	return mockStoreFactory(middlewares)
}
