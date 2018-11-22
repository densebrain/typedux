import * as _ from 'lodash'

export interface IStateConstructor<K, T extends State<K>> {
	Key:string
	new (o?:any):T
	fromJS(o:any):T
}




export interface State<T> {
	type:T
	[key:string]:any
}

export type TRootState = State<string> & {[key:string]:{[key:string]:any}}

/**
 * Function to patch an existing state
 *
 * @param {S} state
 * @param patches
 * @returns {S}
 */
export function patchState<S extends State<any>, SP extends Partial<S>>(state:S,...patches:Array<SP>):S {
		return Object.assign(_.clone(state),...patches)
}
