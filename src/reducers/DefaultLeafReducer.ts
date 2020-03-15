import {ILeafReducer} from './LeafReducer'
import {ActionMessage} from '../actions'
import {isString,isFunction} from '../util'
import {IStateConstructor, State} from "./State"


/**
 * Leaf reducer
 */
export class DefaultLeafReducer<K, S extends State<K>, StateType extends IStateConstructor<K,S>, A extends ActionMessage<S>> implements ILeafReducer<S,A> {
	
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
	static makeLeafReducer<K,S extends State<K>, StateType extends IStateConstructor<K,S>>(
		leaf:string,
		stateType:StateType
	):DefaultLeafReducer<K,S,StateType,ActionMessage<S>> {
		class AnonLeafReducer extends DefaultLeafReducer<K, S, StateType, ActionMessage<S>> {
			
			constructor() {
				super(leaf,stateType)
			}
			
			defaultState(o:any):S {
				return stateType.fromJS(o);
			}
		}
		
		return new AnonLeafReducer()
	}

	constructor(private _leaf:string,private _stateType:StateType) {
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
