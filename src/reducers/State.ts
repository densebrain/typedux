import * as _ from 'lodash'

export interface IStateConstructor<K, T extends State<K>> {
	Key:string
	new (o?:any):T
	fromJS(o:any):T
}




export type State<T = string> = {
	type:T
} & Omit<{
	[key: string]:any
}, "type">

export type TRootState = State<"ROOT"> //& Omit<{[key:string]:{[key:string]:any}}, "type">

export function createDefaultRootState(): TRootState {
	return {
		type: "ROOT"
	}
}

/**
 * Function to patch an existing state
 *
 * @param {S} state
 * @param patches
 * @returns {S}
 */
export function patchState<S extends object = {}, SP extends Partial<S> = Partial<S>>(state:S,...patches:Array<SP>):S {
		return Object.assign(_.clone(state),...patches)
}
