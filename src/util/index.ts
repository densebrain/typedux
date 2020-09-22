export * from "./StringHelpers"
export * from "./TestHelpers"
export * from "./Guards"
export * from './VariableProxy'
export * from './PropertyChain'
export * from './UtilDecorations'
export * from "./Promise"
export * from "./Flag"

/**
 * Retrieve a deep property by string
 *
 * dot separated .
 *
 * @param o
 * @param path
 * @param defaultValue
 * @returns {T}
 */
export function getProperty<T>(o:any,path:string,defaultValue:T = null):T {
	const parts = path.split('.')
	let partVal = o
	for (let part of parts) {
		if (!partVal || !(partVal = partVal[part])) {
			return defaultValue
		}
	}

	return partVal as T
}



