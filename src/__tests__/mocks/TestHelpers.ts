import {Reducer} from 'redux'

import {configureMockStore,MockStore} from './MockStore'
import {setStoreProvider} from '../../actions/index'
import {getLogger} from '@3fv/logger-proxy'
const log = getLogger(__filename)

/**
 * Install a completely mock - EMPTY
 * store provider for the actions
 * framework
 */
export function installMockStoreProvider() {
	setStoreProvider(((...args:any[]) => {
		log.info('MOCK DISPATCH OVERRIDE')
	}) as any, () => {return { type: "MOCK" }})
}


const mockStore = configureMockStore()

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
	onStateChange:(newState:any) => void = null
) {
	const
		newMockStore = mockStore(getState,storeReducers,onStateChange)

	// Globally override the default dispatch
	setStoreProvider(newMockStore)

	return newMockStore
}