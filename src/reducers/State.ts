import {clone} from 'lodash'

export type StateKey<K> = (K extends string? K : never)

export interface StateConstructor<K extends string, S extends State<K>> {
	Key: K
	new (o?:any):S
	fromJS(o:any):S
}

export function createStateConstructor<K extends string, S extends State<K>>(key: K): StateConstructor<K, S> {
	return (class NewStateConstructor implements State<K> {
		
		static Key = key

		static fromJS(o: any) {
			return new NewStateConstructor(o)
		}
		
		type:K = key
		
		constructor(o?:any) {
			Object.assign(this, o || {})
		}
		
		toJS() {
			return {
				...this
			}
		}
	}) as unknown as StateConstructor<K, S>
}


export type State<T = string> = {
	type:T
} & Omit<{
	[key: string]:any
}, "type">

export type RootState = State<"ROOT"> //& Omit<{[key:string]:{[key:string]:any}}, "type">

export function createDefaultRootState(): RootState {
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
		return Object.assign(clone(state),...patches)
}
