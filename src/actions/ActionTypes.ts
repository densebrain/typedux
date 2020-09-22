import type {Action} from 'redux'
import type {Reducer} from "../reducers"

export interface ActionMessage<S> extends Action {
	id?:string
	leaf?:string
	type:any
	stateType:any
	args?:any[]
	reducers?:Reducer<S,ActionMessage<S>>[]
	error?:Error
}


export enum ActionStatus {
	Started = 1,
	Finished = 2
}


export interface PendingAction {
	id:string
	leaf:string
	name:string
	status:ActionStatus
	
}
