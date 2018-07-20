import {State} from "./State"
import {ActionMessage} from "../actions"
import {Reducer} from "./ReducerTypes"
import {ILeafReducer} from "./LeafReducer"
import {isString} from "../util"


export default class DumbReducer<S extends State<string>> implements ILeafReducer<S,ActionMessage<S>> {
	
	private key:string
	private providedState:S = null
	constructor(keyOrState:string|State<string>) {
		if (isString(keyOrState)) {
			this.key = keyOrState
		} else {
			this.key = keyOrState.type
			this.providedState = keyOrState as S
		}
		
	}
	
	leaf():string {
		return this.key;
	}

	prepareState(o:any) {
		return o
	}


	defaultState(o?:any) {
		return this.providedState || {type: this.key} as S
	}
}