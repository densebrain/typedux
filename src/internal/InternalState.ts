

import { IPendingAction } from "../actions/ActionTracker"
import {State} from "../reducers"


/**
 * State interface
 */
export interface IInternalState extends State<any> {
	pendingActions:{[id:string]:IPendingAction}
	totalActionCount:number
	pendingActionCount:number
	hasPendingActions: boolean
}




export class InternalState implements IInternalState {
	
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
	
	type = InternalState
	
	/**
	 * All pending actions
	 */
	pendingActions:{[id:string]:IPendingAction} = {}
	
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
