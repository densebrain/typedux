
import {Record,Map} from 'immutable'
import { IPendingAction } from "../actions/ActionTracker"


/**
 * State interface
 */
export interface IInternalState {
	pendingActions:Map<string,IPendingAction>
	totalActionCount:number
	pendingActionCount:number
	hasPendingActions: boolean
}


/**
 * Internal state record
 */
export const InternalStateRecord = Record({
	pendingActions:Map<string,IPendingAction>(),
	totalActionCount: 0,
	pendingActionCount: 0,
	hasPendingActions: false
} as IInternalState)


export class InternalState extends InternalStateRecord {
	
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
		
		
		return state.set(
			'pendingActions',
			Map.isMap(pendingActions) ? pendingActions : Map(pendingActions)
		)
	}
	
	
	/**
	 * Create a new internal state
	 */
	constructor() {
		super()
	}
	
	/**
	 * All pending actions
	 */
	pendingActions:Map<string,IPendingAction>
	
	totalActionCount:number
	
	pendingActionCount:number
	
	hasPendingActions:boolean
	
	/**
	 * Returns empty object - can not be serialized
	 */
	toJS() {
		return {}
	}
	
	
}
