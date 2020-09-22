import {Action, applyMiddleware, Middleware, Reducer, Store, Unsubscribe} from "redux"
import { ObservableStore } from "../../store/ObservableStore"
import {State, StateArgs} from "../../reducers"
import {isFunction} from '../../util'
import {ActionFactory, ActionFactoryConstructor} from "../../actions/ActionFactory"

/**
 * Slightly extended Store interface for
 * easier testing
 */
export class MockStore<S extends State> extends ObservableStore<S> {
	// setState(newState)
	// getActions()
	// getReducer:Reducer<S>
	// clearActions()
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
function mockStoreFactory(middlewares:Middleware[] = [], stateArgs: StateArgs[] = [],  actionFactories: Array<ActionFactoryConstructor<any> | ActionFactory<any, any>> = []):MockStoreFactory {
	return function(fromState:any,storeReducer = null,onStateChange:Function = null,storeMixins:any = null):MockStore<any> {

		// First calculate the store state if a function was provided
		let storeState = (isFunction(fromState)) ? fromState() : fromState

		function makeStore() {
			
			const store = new MockStore<any>(
				ObservableStore.makeSimpleReducers(...stateArgs),
				null,
				null,
				storeState
			)
			

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

export function configureMockStoreFactory(middlewares:Middleware[] = [], stateArgs: StateArgs[] = [], actionFactories: Array<ActionFactoryConstructor<any> | ActionFactory<any, any>> = []) {
	return mockStoreFactory(middlewares,stateArgs,actionFactories)
}
