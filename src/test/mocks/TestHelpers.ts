import {Middleware, Reducer} from 'redux'

import {configureMockStoreFactory, MockStore, MockStoreFactory} from './MockStore'

import {ActionFactory, setGlobalStore} from '../../actions'
import {getLogger} from '@3fv/logger-proxy'
import {State, StateArgs} from '../../reducers'
import {ObservableStore} from "../../store/ObservableStore"
const log = getLogger(__filename)



// ObserveableStore
// ((...args:any[]) => {
// 	log.info('MOCK DISPATCH OVERRIDE')
// }) as any, () => ({ type: "MOCK" }) as State<"MOCK">
/**
 * Install a completely mock - EMPTY
 * store provider for the actions
 * framework
 */
export function installMockGlobalStore(store: ObservableStore<any>) {
	setGlobalStore(store)
}


const defaultMockStoreFactory = configureMockStoreFactory()

/**
 * In testing any of these types can be provided as a state
 */
export type TestStateType = Function | void

/**
 * Create a mock store for the sake of testing
 *
 * @param getState
 * @param storeReducers
 * @param onStateChange
 * @returns {MockStore}
 */
export function createMockStore(
	getState:TestStateType,
	storeReducers:Reducer<any> = null,
	onStateChange:(newState:any) => void = null,
	mockStoreFactory: MockStoreFactory = defaultMockStoreFactory
) {
	const
		newMockStore = mockStoreFactory(getState,storeReducers,onStateChange)

	// Globally override the default dispatch
	setGlobalStore(newMockStore)

	return newMockStore
}
