


/**
 * Create a simple mapped reducer fn
 *
 * @param propertyKey
 * @param args
 * @returns {function(S, M): S}
 */



export function makeMappedReducerFn<S extends any,M>(propertyKey:string,args) {
	return (state:S, message:M):S => {
		let stateFn = state[propertyKey]
		if (!stateFn)
			throw new Error(`Unable to find mapped reduce function on state ${propertyKey}`)

		if (state && typeof (state as any).withMutation === 'function') {
			const newState = (state as any).withMutation(tempState => {
				tempState = tempState[propertyKey](...args)
				return tempState
			})

			return  ((newState === (state as any)) ? state : newState) as S

		} else {
			return stateFn(...args)
		}
	}
}