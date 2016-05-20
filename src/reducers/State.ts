import * as Immutable from 'immutable'



/**
 *
 */
export interface ILeafState extends Immutable.Record.Class {
	error:Error
}

export type State = Immutable.Map<string,ILeafState>