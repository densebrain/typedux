//import 'reflect-metadata'
import {getLogger} from 'typelogger'
const log = getLogger(__filename)

//const log = require<any>('log/make')('ActionLoader')
import {VariableProxy} from "../util";


// Map type for proxies
type ProxyMap = {[key:string]:VariableProxy<any>}

// The proxy container
const proxies:ProxyMap = {}

export class ActionRouter {

	private actionFactories = []

	constructor(...actionFactories) {
		this.actionFactories.push(...actionFactories)
	}

	/**
	 * Update a specific action factory
	 *
	 * @param key
	 * @param actions
	 */
	update<T>(key,actions:T) {
		if (proxies[key]) {
			proxies[key].changeTarget(actions)
		} else {
			proxies[key] = new VariableProxy(actions,['dispatcher'])
			ActionRouter[key] = proxies[key].proxy
		}
	}

	load() {
		// TODO: Implement load
		// update('LogActions', new LogActionFactory())
		// update('EditorActions', new EditorActionFactory())
		// update('DocumentationActions', new DocumentationActionFactory())
		// update('TipActions', new TipActionFactory())
	}
}

