import DumbReducer from "../reducers/DumbReducer"

require("source-map-support").install()

import {isFunction, isString} from "../util"
import {getValue} from 'typeguard'

import {installMockStoreProvider,createMockStore} from './mocks/TestHelpers'
import {RootReducer, ILeafReducer, State, Reducer} from '../reducers'
import {ActionMessage, ActionFactory, ActionReducer} from '../actions'

import {getLogger} from 'typelogger'

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
 * Mock leaf state, dumb test state with test props
 */
class MockLeafState implements State<any> {
	type = MockLeafState
	
	str1:string = MockStateStr1
	str2:string

	constructor(props:any = {}) {
		
		
		Object.assign(this,props)
	}
}

/**
 * Make root reducer
 *
 * @param {ILeafReducer<any, any>} leafReducers
 * @returns {RootReducer<State<any>>}
 */
function makeRootReducer(...leafReducersOrStates:Array<ILeafReducer<any,any>|State<string>>) {
	let
		leafReducers = leafReducersOrStates.filter(it => isFunction(getValue(() => (it as any).leaf))) as Array<ILeafReducer<any,any>>,
		leafStates = leafReducersOrStates.filter(it => !isFunction(getValue(() => (it as any).leaf)) && isString(getValue(() => (it as any).type))) as Array<State<string>>
	
	leafReducers = [...leafReducers, ...leafStates.map(state => new DumbReducer(state))]
	
	return new RootReducer(null,...leafReducers)
}

interface IMockState extends State<string> {
	type: string
	[key:string]:any
}

/**
 * Typed action message
 */
interface MockMessage extends ActionMessage<MockLeafState> {

}

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
class MockActionFactory extends ActionFactory<MockLeafState,MockMessage> {

	constructor() {
		super(MockLeafState)
	}

	leaf():string {
		return MockKey;
	}



	@ActionReducer()
	mockUpdate(val:string) {
		return (state:IMockState) => ({...state, str1: val})
	}

	@ActionReducer()
	mockUpdateFromState(newVal:string) {
		return (state:Map<string,any>) => ({...state, str2: newVal})
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
		[leafReducer] = ObservableStore.makeSimpleReducers({type: MockKey, str1: MockStateStr1})//new MockLeafReducer()
		
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
			state = store.getState(),
			mockState = actions.state
		
		expect(mockState.str2).not.toBeUndefined()

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
							internalState = getStoreInternalState()
						
						expect(internalState.hasPendingActions).toBe(false)
						expect(internalState.totalActionCount).toBe(1)
						expect(internalState.pendingActionCount).toBe(0)
					})
			}),
			
			// TRACKING TEST
			pendingPromise = Promise.delay(300).then(() => {
				expect(getStoreInternalState().hasPendingActions).toBe(true)
				expect(getStoreInternalState().pendingActionCount).toBe(1)
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
						internalState = getStoreInternalState()
					
					expect(internalState.pendingActionCount).toBe(0)
					
				})
			})
			
	})

})
