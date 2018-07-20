

/**
 * Responsible for observing
 * and notifying store listeners
 * with provided paths
 */


import {isArray} from '../util'
import {State} from '../reducers'
import {getLogger} from 'typelogger'

const
	log = getLogger(__filename)

function getNewValue(state:any,keyPath:Array<string|number>) {
	let newValue = state

	for (let key of keyPath) {
		if (!newValue) break

		let
			tempValue = (newValue.get) ? newValue.get(key) : null
		
		newValue = tempValue || newValue[key]

		//(this.keyPath.length > 0) ? state.getIn(this.keyPath) : state
	}

	return newValue
}

export type TStateChangeHandler = (newValue:any,oldValue:any,observer:StateObserver) => any

export class StateObserver {
	
	/**
	 * Last value received
	 */
	private cachedValue
	
	/**
	 * The key path to watch
	 */
	private keyPath:Array<string|number>
	
	/**
	 * Flags when the observer has been removed
	 *
	 * @type {boolean}
	 */
	removed:boolean = false

	

	constructor(path:string | Array<string|number>,private handler:TStateChangeHandler) {
		this.keyPath = path ? ((isArray(path)) ? path : path.split('.')) : []
	}

	onChange(state:State<any>):boolean {
		const newValue = getNewValue(state,this.keyPath)

		// Check for change/diff
		let cachedValue = this.cachedValue
		
		if (newValue === cachedValue)
			return false

		// Update the old ref
		this.cachedValue = newValue

		log.debug(`Path ${this.keyPath.join(',')} changed, to`,newValue,'from',cachedValue)
		this.handler(newValue,cachedValue,this)
		return true
	}
}

export default StateObserver

