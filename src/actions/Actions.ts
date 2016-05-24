
const log = getLogger(__filename)

import {Store,Dispatch} from 'redux'
import {State} from '../reducers'


// Internal type definition for
// function that gets the store state
export type GetStoreState = () => State
export type DispatchState = Dispatch<State>

/**
 * Reference to a dispatcher
 */
let dispatch:DispatchState

/**
 * Reference to store state
 */
let getStoreState:GetStoreState

/**
 * Get the current store state get
 * function - usually set when a new state is created
 *
 * @returns {GetStoreState}
 */
export function getStoreStateProvider():GetStoreState {
	return getStoreState
}

/**
 * Get the current store
 * dispatch function
 *
 * @returns {DispatchState}
 */
export function getStoreDispatchProvider():DispatchState {
	return dispatch
}

/**
 * Set the global store provider
 *
 * @param newDispatch
 * @param newGetState
 */
export function setStoreProvider(newDispatch:DispatchState|Store<State>,newGetState?:GetStoreState) {
	if (newGetState) {
		dispatch = newDispatch as DispatchState
		getStoreState = newGetState
	} else if (<Store<State>>newDispatch) {

		// Cast the guarded type
		const newStore = <Store<State>>newDispatch

		// Set and bind
		dispatch = newStore.dispatch.bind(newDispatch)
		getStoreState = newStore.getState.bind(newDispatch)
	}

	if (!dispatch || !getStoreState)
		throw new Error('Set store provider must include both dispatch and getState')
}



