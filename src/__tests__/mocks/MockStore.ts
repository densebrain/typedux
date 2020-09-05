import {Action, applyMiddleware, Middleware, Reducer, Store, Unsubscribe} from "redux"
import {isFunction} from '../../util/index'

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
			
			function subscribe(listener:() => void):Unsubscribe {
				return () => {
					//unsubscribe
				};
			}
			
			function getState():any {
				return storeState
			}
			
			function observable() {
				const outerSubscribe = subscribe
				return {
					/**
					 * The minimal observable subscription method.
					 * @param {Object} observer Any object that can be used as an observer.
					 * The observer object should have a `next` method.
					 * @returns {subscription} An object with an `unsubscribe` method that can
					 * be used to unsubscribe the observable from the store, and prevent further
					 * emission of values from the observable.
					 */
					subscribe(observer) {
						if (typeof observer !== 'object' || observer === null) {
							throw new TypeError('Expected the observer to be an object.')
						}
						
						function observeState() {
							if (observer.next) {
								observer.next(getState())
							}
						}
						
						observeState()
						const unsubscribe = outerSubscribe(observeState)
						return { unsubscribe }
					},
					
					[Symbol.observable]() {
						return this
					}
				}
			}
			
			const store:MockStore<any> = {

				getState,

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

				subscribe,

				getReducer() {
					return storeReducer
				},
				replaceReducer(newReducer:Reducer<any>) {
					storeReducer = newReducer
				},
				
				[Symbol.observable]() {
					return observable()
				}
			}

			if (storeMixins)
				Object.assign(store, storeMixins)

			return store
		}

		if (middlewares.length) {
			const addMiddleware = applyMiddleware(...middlewares)(makeStore as any)
			return addMiddleware(storeReducer,fromState) as any
		} else {
			return makeStore()
		}
	}
}

export function configureMockStore(...middlewares:Middleware[]) {
	return mockStoreFactory(middlewares)
}
