import "source-map-support/register"
import "jest"

import {createMockStore} from './mocks/TestHelpers'
import {ILeafReducer, RootReducer, State} from '../reducers'

import {getLogger} from '@3fv/logger-proxy'

import {Bluebird as Promise} from "../util"
import {ObservableStore} from "../store"
import {getGlobalStoreInternalState} from "../actions"
import {createMockRootReducer} from "./mocks/createMockRootReducer"
import {getDefaultMockState, MockKey, MockStateStr1} from "./mocks/MockConstants"
import {MockActionFactory} from "./mocks/MockActionFactory"
import {configureMockStoreFactory, MockStoreFactory} from "./mocks/MockStore"
import {MockLeafState} from "./mocks/MockLeafState"


const
	log = getLogger(__filename)


// configureMockStoreFactory()
// installMockGlobalStore()





//
// class MockLeafReducer implements ILeafReducer<MockLeafState,MockMessage> {
//
// 	leaf():string {
// 		return MockKey;
// 	}
//
// 	prepareState(o:any) {
// 		return o
// 	}
//
//
// 	defaultState() {
// 		return new MockLeafState()
// 	}
// }

// Simple mock factory



describe('#typedux', function() {
	jest.setTimeout(10000)
	
	let
		//reducer:RootReducer<any>,
		mockStoreFactory: MockStoreFactory,
		leafReducer:ILeafReducer<any,any>,
		store = null,
		actions:MockActionFactory

	beforeEach(() => {
		//[leafReducer] = ObservableStore.makeSimpleReducers({type: MockKey, str1: MockStateStr1} as State<typeof MockKey>)//new MockLeafReducer()
		
		// ROOT REDUCER
		//reducer = createMockRootReducer(ObservableStore.makeInternalReducer(),leafReducer)
		
		mockStoreFactory = configureMockStoreFactory([], [], [MockActionFactory])
		
		// STORE
		store = mockStoreFactory(() => ({
			[MockLeafState.Key]: new MockLeafState()
		}), )
		// 	createMockStore(
		// 	getDefaultMockState(reducer),
		// 	reducer.makeGenericHandler(),
		// 	(data) => {
		// 	log.debug('on state change',data)
		// })

		// INIT
		store.dispatch({type:'@INIT'})
		
		// ACTIONS
		actions = new MockActionFactory()
	})

	it('Uses reducers on the action message',() => {

		let state = store.getState()
		let mockState = actions.state
		expect(mockState.str1).toBe(MockStateStr1)

		// Make an update
		const mockStr1Update = 'my own personal idaho'
		actions.mockUpdate(mockStr1Update)

		// Ensure state is different
		expect(store.getState()).not.toBe(state)

		// Make sure the children changed too
		let mockStateAfter = actions.state
		expect(mockState).not.toBe(mockStateAfter)
		expect(mockStr1Update).toBe(mockStateAfter.str1)
	})

	it('Uses state reducers too',() => {
		let
			//state = store.getState(),
			mockState = actions.state
		
		expect(mockState.str2).toBeUndefined()

		const str2Update = 'my new str2'
		actions.mockUpdateFromState(str2Update)

		let mockStateAfter = actions.state
		expect(mockStateAfter.str2).toBe(str2Update)
		expect(mockStateAfter.str2).not.toBe(mockState.str2)
	})
	
	it('Promises action',() => {
		const
			
			// FUNCTION TEST
			thunkPromise = actions.mockThunk().then((result) => {
				expect(result).toBe('mock')
				
				return Promise
					.delay(1000).then(() => {
						const
							internalState = getGlobalStoreInternalState()
						
						expect(internalState.hasPendingActions).toBe(false)
						expect(internalState.totalActionCount).toBe(1)
						expect(internalState.pendingActionCount).toBe(0)
					})
			}),
			
			// TRACKING TEST
			pendingPromise = Promise.delay(300).then(() => {
				expect(getGlobalStoreInternalState().hasPendingActions).toBe(true)
				expect(getGlobalStoreInternalState().pendingActionCount).toBe(1)
			})
			
			
		
		return pendingPromise.then(() => thunkPromise)
		
	})
	
	it('Promises action Exception',() => {
		return actions.mockThunkError()
			.then((result) => {
				throw new Error(`Thunk should not resolve, - should reject`)
			})
			.catch(err => {
				expect(err instanceof Error).toBe(true)
				
				return Promise.delay(1000).then(() => {
					
					const
						internalState = getGlobalStoreInternalState()
					
					expect(internalState.pendingActionCount).toBe(0)
					
				})
			})
			
	})

})
