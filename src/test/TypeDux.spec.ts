import {installMockStoreProvider,createMockStore} from './mocks/TestHelpers'
import {RootReducer,ILeafReducer} from '../reducers'
import {ActionMessage,ActionFactory,Action} from '../actions'
import * as _ from 'lodash'

const log = getLogger(__filename)

installMockStoreProvider()

function makeRootReducer(...leafReducers) {
	return new RootReducer(...leafReducers)
}

function getDefaultState(reducer) {
	return reducer.handle(null,{type:'@INIT'})
}

const MockKey = 'mock'
const MockStateStr1 = 'my first string'


class MockState {
	str1 = MockStateStr1
	str2:string

	constructor(props:any = {}) {
		Object.assign(this,props)
	}

	mockUpdateFromState(newVal:string) {
		log.debug('Updating from state reducer')
		let newState = new MockState(this)
		newState.str2 = newVal

		return newState
	}

	toJS() {
		return this
	}
}

/**
 * Typed action message
 */
interface MockMessage extends ActionMessage<MockState> {

}


class MockLeafReducer implements ILeafReducer<MockState,MockMessage> {

	leaf():string {
		return MockKey;
	}

	prepareState(o:any) {
		return o
	}


	defaultState() {
		return new MockState()
	}
}

// Simple mock factory
class MockActionFactory extends ActionFactory<MockState,MockMessage> {

	constructor() {
		super(MockState)
	}

	leaf():string {
		return MockKey;
	}



	@Action({
		reducers: [
			(state:MockState,msg:MockMessage) => {
				state = new MockState()
				state.str1 = msg.args[0]
				return state
			}
		]
	})
	mockUpdate(val:string) {

	}

	@Action()
	mockUpdateFromState(newVal:string){}
}


describe('#typedux',() => {
	let reducer = null, leafReducer = null, store = null, actions = null

	beforeEach(() => {
		leafReducer = new MockLeafReducer()
		reducer = makeRootReducer(leafReducer)
		store = createMockStore(getDefaultState(reducer),reducer.makeGenericHandler(),(data) => {
			log.info('on state change',data)
		})

		store.dispatch({type:'@INIT'})

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
		let state = store.getState()
		let mockState = actions.state
		expect(mockState.str2).not.to.be.exist

		const str2Update = 'my new str2'
		actions.mockUpdateFromState(str2Update)

		let mockStateAfter = actions.state
		expect(mockStateAfter.str2).to.equal(str2Update)
		expect(mockStateAfter.str2).not.to.equal(mockState.str2)
	})

})