


import {ActionMessage} from "../actions"
import {State,ILeafState} from '../reducers'


/**
 * S - type of State
 * T - type of actions/enum
 * M - type of message
 */
export interface ILeafReducer<S extends ILeafState,A extends ActionMessage<S>> {

	/**
	 * The path to the leaf it handles
	 */
	leaf():string

	/**
	 * Get the default state
	 */
	defaultState():S

	/**
	 * Handle an incoming action
	 * @param state
	 * @param action
	 */
	handle?: (state:S,action:A) => S

	/**
	 * Handle an error occurence
	 *
	 * @param state
	 * @param type
	 * @param action
	 * @param error
	 */
	handleError?: (state:S,action:A,error:Error) => S



}
