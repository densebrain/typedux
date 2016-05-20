import * as Immutable from 'immutable'



/**
 *
 */
export interface ILeafState {
	error:Error
}

export type State = Immutable.Map<string,ILeafState>