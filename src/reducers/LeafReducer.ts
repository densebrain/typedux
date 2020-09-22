


import type {ActionMessage} from "../actions"
import type { State } from "./State";

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
export interface ILeafReducer<S extends State<any>,A extends ActionMessage<S> = ActionMessage<S>> {




	/**
	 * The path to the leaf it handles
	 */
	leaf():string

	/**
	 * Get the default state
	 */
	defaultState(o?:any):S

	/**
	 * Optional init function coverage
	 *
	 * @param state
	 */
	init?:(state:S) => S
	
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
	 * @param action
	 * @param error
	 */
	handleError?: (state:S,action:A,error:Error) => S



}
