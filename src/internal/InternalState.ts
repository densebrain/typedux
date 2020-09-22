

import type { PendingAction } from "../actions"
import type {State} from "../reducers"




export class InternalState implements State<"InternalState"> {
	
	static Key:"InternalState" = "InternalState"
	
	/**
	 * Deserialize
	 *
	 * @param o
	 * @returns {InternalState&U&{pendingActions: (Map<any, any>|Map<string, any>|any)}}
	 */
	static fromJS(o:any = {}) {
		if (o instanceof InternalState)
			return o
		
		const
			state = new InternalState(),
			{pendingActions = {}} = o
		
		
		return Object.assign(state, {pendingActions})
	}
	
	/**
	 * Create a new internal state
	 */
	constructor(o:any = {}) {
		Object.assign(this,o)
	}
	
	type:"InternalState" = "InternalState"
	
	/**
	 * All pending actions
	 */
	pendingActions:{[id:string]:PendingAction} = {}
	
	totalActionCount:number = 0
	
	pendingActionCount:number = 0
	
	hasPendingActions:boolean = false
	
	/**
	 * Returns empty object - can not be serialized
	 */
	toJS() {
		return this
	}
	
	
}
