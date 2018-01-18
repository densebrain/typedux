import {Reducer} from 'redux'
import * as Immutable from 'immutable'
import {configureMockStore,MockStore} from './MockStore'
import {setStoreProvider} from '../../actions'
import {getLogger} from 'typelogger'
const log = getLogger(__filename)

/**
 * Install a completely mock - EMPTY
 * store provider for the actions
 * framework
 */
export function installMockStoreProvider() {
	setStoreProvider(((...args:any[]) => {
		log.info('MOCK DISPATCH OVERRIDE')
	}) as any, () => {return Immutable.Map<any,any>()})
}


const mockStore = configureMockStore()

/**
 * In testing any of these types can be provided as a state
 */
export type TestStateType = Function | void | Immutable.Map<string,any>

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
	onStateChange:(newState:any) => void = null
) {
	const
		newMockStore = mockStore(getState,storeReducers,onStateChange)

	// Globally override the default dispatch
	setStoreProvider(newMockStore)

	return newMockStore
}
