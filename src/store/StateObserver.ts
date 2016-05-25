import {getLogger} from 'typelogger'
import {isArray} from '../util'
import {State} from '../reducers'

const log = getLogger(__filename)

export class StateObserver {

	removed:boolean = false

	private cachedValue
	private keyPath:string[]

	constructor(path:string | string[],private handler) {
		this.keyPath = (isArray(path)) ? path : path.split('.')
	}


	onChange(state:State):void {
		let newValue = state.getIn(this.keyPath);

		// Check for change/diff
		let cachedValue = this.cachedValue
		if (newValue === cachedValue) return;

		// Update the old ref
		this.cachedValue = newValue;

		log.debug(`Path ${this.keyPath.join(',')} changed, to`,newValue,'from',cachedValue);
		this.handler(newValue,cachedValue,this);
	}
}

export default StateObserver

