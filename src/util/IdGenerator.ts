

function s4() {
	return Math
		.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1)
}


/**
 * Generate UUID-like value, NOT UUID AND NO NEED
 *
 *
 * @see http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 * @returns {string}
 */
export function makeId() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4()
	
}