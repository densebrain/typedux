import {installMockStoreProvider,createMockStore} from './mocks/TestHelpers'
import {RootReducer,ILeafReducer} from '../reducers'
import {ActionMessage, ActionFactory, ActionReducer} from '../actions'

import {getLogger} from 'typelogger'
import {Map,Record} from 'immutable'
import { ActionThunk, Promised } from "../actions/ActionDecorations"

import Promise from "../util/PromiseConfig"
import { ObservableStore } from "../store/ObservableStore"
import { getStoreInternalState } from "../actions/Actions"

const
	log = getLogger(__filename)

installMockStoreProvider()

function getDefaultState(reducer) {
	return reducer.handle(null,{type:'@INIT'})
}

const
	MockKey = 'mock',
	MockStateStr1 = 'my first string'

/**
 * Leaf record defines allowed props
 */
const MockLeafRecord = Record({
	str1: MockStateStr1,
	str2: null
})

/**
 * Mock leaf state, dumb test state with test props
 */
class MockLeafState extends MockLeafRecord {
	str1:string
	str2:string

	constructor(props:any = {}) {
		super(props)
		
		Object.assign(this,props)
	}
}


function makeRootReducer(...leafReducers) {
	return new RootReducer(null,...leafReducers)
}

/**
 * Typed action message
 */
interface MockMessage extends ActionMessage<MockLeafState> {

}


class MockLeafReducer implements ILeafReducer<MockLeafState,MockMessage> {

	leaf():string {
		return MockKey;
	}

	prepareState(o:any) {
		return o
	}


	defaultState() {
		return new MockLeafState()
	}
}

// Simple mock factory
class MockActionFactory extends ActionFactory<MockLeafState,MockMessage> {

	constructor() {
		super(MockLeafState)
	}

	leaf():string {
		return MockKey;
	}



	@ActionReducer()
	mockUpdate(val:string) {
		return (state:Map<string,any>) => state.set('str1',val)
	}

	@ActionReducer()
	mockUpdateFromState(newVal:string) {
		return (state:Map<string,any>) => state.set('str2', newVal)
	}
	
	@ActionThunk()
	mockThunk() {
		return Promised((dispatch,getState) => {
			return Promise.delay(1000).then(() => "mock")
		})
	}
	
	@ActionThunk()
	mockThunkError() {
		return Promised((dispatch,getState) => {
			return Promise.delay(1000).then(() => {
				throw new Error('MockThunkErrorTest')
			})
		})
	}
}


describe('#typedux', function() {
	this.timeout(10000)
	
	let
		reducer:RootReducer<any>,
		leafReducer:ILeafReducer<any,any>,
		store = null,
		actions:MockActionFactory

	beforeEach(() => {
		leafReducer = new MockLeafReducer()
		
		// ROOT REDUCER
		reducer = makeRootReducer(ObservableStore.makeInternalReducer(),leafReducer)
		
		// STORE
		store = createMockStore(
			getDefaultState(reducer),
			reducer.makeGenericHandler(),(data) => {
			log.debug('on state change',data)
		})

		// INIT
		store.dispatch({type:'@INIT'})
		
		// ACTIONS
		actions = new MockActionFactory()
	})

	it('Uses reducers on the action message',() => {

		let state = store.getState()
		let mockState = actions.state
		expect(mockState.str1).to.equal(MockStateStr1)

		// Make an update
		const mockStr1Update = 'my own personal idaho'
		actions.mockUpdate(mockStr1Update)

		// Ensure state is different
		expect(store.getState()).not.to.equal(state)

		// Make sure the children changed too
		let mockStateAfter = actions.state
		expect(mockState).not.to.equal(mockStateAfter)
		expect(mockStr1Update).to.equal(mockStateAfter.str1)
	})

	it('Uses state reducers too',() => {
		let
			state = store.getState(),
			mockState = actions.state
		
		expect(mockState.str2).not.to.be.exist

		const str2Update = 'my new str2'
		actions.mockUpdateFromState(str2Update)

		let mockStateAfter = actions.state
		expect(mockStateAfter.str2).to.equal(str2Update)
		expect(mockStateAfter.str2).not.to.equal(mockState.str2)
	})
	
	it('Promises action',() => {
		const
			
			// FUNCTION TEST
			thunkPromise = actions.mockThunk().then((result) => {
				expect(result).to.equal('mock')
				
				return Promise
					.delay(1000).then(() => {
						const
							internalState = getStoreInternalState()
						
						expect(internalState.hasPendingActions).to.equal(false)
						expect(internalState.totalActionCount).to.equal(1)
						expect(internalState.pendingActionCount).to.equal(0)
					})
			}),
			
			// TRACKING TEST
			pendingPromise = Promise.delay(300).then(() => {
				expect(getStoreInternalState().hasPendingActions).to.equal(true)
				expect(getStoreInternalState().pendingActionCount).to.equal(1)
			})
			
			
		
		return pendingPromise.then(() => thunkPromise)
			
	})
	
	it('Promises action Exception',() => {
		return actions.mockThunkError()
			.then((result) => {
				throw new Error(`Thunk should not resolve, - should reject`)
			})
			.catch(err => {
				expect(err instanceof Error).to.equal(true)
				
				return Promise.delay(1000).then(() => {
					
					const
						internalState = getStoreInternalState()
					
					expect(internalState.pendingActionCount).to.equal(0)
					
				})
			})
			
	})

})
