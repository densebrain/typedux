

/**
 * Responsible for observing
 * and notifying store listeners
 * with provided paths
 */


import {isArray} from '../util'
import {State} from '../reducers'
import {getLogger} from 'typelogger'

const log = getLogger(__filename)

function getNewValue(state:any,keyPath:string[]) {
	let newValue = state

	for (let key of keyPath) {
		if (!newValue) break

		let tempValue = (newValue.get) ? newValue.get(key) : null
		newValue = tempValue || newValue[key]

		//(this.keyPath.length > 0) ? state.getIn(this.keyPath) : state
	}

	return newValue
}

export class StateObserver {

	removed:boolean = false

	private cachedValue
	private keyPath:string[]

	constructor(path:string | string[],private handler) {
		this.keyPath = path ? ((isArray(path)) ? path : path.split('.')) : []
	}

	onChange(state:State):boolean {
		const newValue = getNewValue(state,this.keyPath)

		// Check for change/diff
		let cachedValue = this.cachedValue
		if (newValue === cachedValue) return false

		// Update the old ref
		this.cachedValue = newValue

		log.debug(`Path ${this.keyPath.join(',')} changed, to`,newValue,'from',cachedValue)
		this.handler(newValue,cachedValue,this)
		return true
	}
}

export default StateObserver

