


import {ActionMessage} from "../actions"

/**
 * Check object shape to see if
 * its a valid ILeafReducer
 *
 * @param o
 * @returns {boolean}
 */
export function isLeafReducer(o:any):o is ILeafReducer<any,any> {
	return (o.leaf && o.defaultState)
}

/**
 * S - type of State
 * T - type of actions/enum
 * M - type of message
 */
export interface ILeafReducer<S extends any,A extends ActionMessage<S>> {




	/**
	 * The path to the leaf it handles
	 */
	leaf():string

	/**
	 * Get the default state
	 */
	defaultState(o?:any):S


	/**
	 * Prepare an object to be used as the state
	 * for this leaf
	 *
	 * @param o
	 */
	prepareState(o:any|S):S

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
