import type {State} from "./State"
import type {ActionMessage} from "../actions"
import type {ILeafReducer} from "./LeafReducer"
import {isString} from "../util"
import { clone } from "lodash"


export default class DumbReducer<S extends State<string>> implements ILeafReducer<S,ActionMessage<S>> {
	
	private readonly key:string
	private readonly providedState:S = null
	
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
		return clone(this.providedState) || {type: this.key} as S
	}
}
