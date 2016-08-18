import {installMockStoreProvider,createMockStore} from './mocks/TestHelpers'
import {RootReducer,ILeafReducer} from '../reducers'
import {ActionMessage, ActionFactory, Action, ActionReducer} from '../actions'
import {getLogger} from 'typelogger'
import {Map,Record} from 'immutable'

const log = getLogger(__filename)

installMockStoreProvider()



function getDefaultState(reducer) {
	return reducer.handle(null,{type:'@INIT'})
}

const MockKey = 'mock'
const MockStateStr1 = 'my first string'

/**
 * Leaf record defines allowed props
 *
 * @type {Record.Class}
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


//const MapType = typeof Map<string,any>()

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
class MockActionFactory extends ActionFactory<Map<string,any>,MockMessage> {

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
