import {ILeafReducer} from './LeafReducer'
import {ActionMessage} from '../actions'
import {isString,isFunction} from '../util'
import { IStateConstructor } from "./State"


/**
 * Leaf reducer
 */
export class DefaultLeafReducer<S extends any,A extends ActionMessage<S>> implements ILeafReducer<S,A> {
	
	/**
	 * Inflate from js
	 *
	 * @param stateType
	 * @param o
	 * @returns {any}
	 */
	static stateFromJS<S>(stateType:{new():S},o:any):S {
		const
			{fromJS} = stateType as any
		return (fromJS) ? fromJS(o) : new (stateType as any)(o)
	}
	
	
	/**
	 * Create a new leaf reducer
	 *
	 * @param leaf
	 * @param stateType
	 * @returns {AnonLeafReducer}
	 */
	static makeLeafReducer<StateType>(leaf:string,stateType:IStateConstructor<StateType>):DefaultLeafReducer<StateType,ActionMessage<StateType>> {
		class AnonLeafReducer extends DefaultLeafReducer<StateType,ActionMessage<StateType>> {
			
			constructor() {
				super(leaf,stateType)
			}
			
			defaultState(o:any):StateType {
				return stateType.fromJS(o);
			}
		}
		
		return new AnonLeafReducer()
	}

	constructor(private _leaf:string,private _stateType:IStateConstructor<S>) {
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

	defaultState(o:any):S {
		return new (this._stateType as any)(o);
	}
	
	equals(o) {
		const otherLeaf = isString(o) ? o :
			(o && isFunction(o.leaf)) ? o.leaf() :
				null
		
		return (otherLeaf && otherLeaf === o.leaf())
	}
	
	valueOf() {
		return this.leaf()
	}

}