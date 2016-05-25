import {Action} from 'redux'
import {Reducer} from "../reducers"

export interface ActionMessage<S> extends Action {
	type:string
	stateType:any
	args?:any[]
	reducers:Reducer<S,ActionMessage<S>>[]
	error:Error
}
