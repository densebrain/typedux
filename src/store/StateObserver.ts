

/**
 * Responsible for observing
 * and notifying store listeners
 * with provided paths
 */


import {isArray} from '../util'
import {State} from '../reducers'
import {getLogger} from 'typelogger'
import { Selector } from '../selectors';

const
	log = getLogger(__filename)



export type TStateChangeHandler<S extends State<string>, T> = (newValue:T,oldValue:T,observer:StateObserver<S, T>) => any

export class StateObserver<S extends State<string>, T> {
	
	/**
	 * Last value received
	 */
	private cachedValue: T | undefined = undefined
	
	
	//private selector: Selector<S,T>
	/**
	 * The key path to watch
	 */
	//private keyPath:Array<string|number>
	
	/**
	 * Flags when the observer has been removed
	 *
	 * @type {boolean}
	 */
	removed:boolean = false

	

	//constructor(s:string | Array<string|number>,private handler:TStateChangeHandler<S,T>) {
	constructor(private selector: Selector<S,T>,private handler:TStateChangeHandler<S,T>) {
		//this.keyPath = path ? ((isArray(path)) ? path : path.split('.')) : []
	}

	onChange(state:S):boolean {
		const
			newValue = this.selector(state)// this.keyPath.length ? getNewValue(state,this.keyPath) : state

		// Check for change/diff
		const cachedValue = this.cachedValue
		
		if (newValue === cachedValue)
			return false

		// Update the old ref
		this.cachedValue = newValue

		//log.debug(`Path ${this.keyPath.join(',')} changed, to`,newValue,'from',cachedValue)
		this.handler(newValue,cachedValue,this)
		return true
	}
}

export default StateObserver

