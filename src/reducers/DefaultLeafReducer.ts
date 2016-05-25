import {ILeafReducer} from './LeafReducer'
import {ActionMessage} from '../actions'

export class DefaultLeafReducer<S extends any,A extends ActionMessage<S>> implements ILeafReducer<S,A> {

	constructor(private _leaf:string,private _stateType:{new():S}) {
	}

	stateType() {
		return this._stateType
	}

	leaf():string {
		return this._leaf;
	}

	defaultState():S {
		return new this._stateType();
	}
	
}