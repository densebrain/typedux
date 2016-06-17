import {ILeafReducer} from './LeafReducer'
import {ActionMessage} from '../actions'



export class DefaultLeafReducer<S extends any,A extends ActionMessage<S>> implements ILeafReducer<S,A> {

	static stateFromJS<S>(stateType:{new():S},o:any):S {
		const {fromJS} = stateType as any
		return (fromJS) ? fromJS(o) : new (stateType as any)(o)
	}

	constructor(private _leaf:string,private _stateType:{new():S}) {
	}

	prepareState(o:any|S):S {
		return (o instanceof this._stateType) ? o : DefaultLeafReducer.stateFromJS(this._stateType,o)
	}

	stateType() {
		return this._stateType
	}

	leaf():string {
		return this._leaf;
	}

	defaultState():S {
		return new (this._stateType)();
	}

}