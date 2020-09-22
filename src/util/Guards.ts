/**
 * Is a given value a function
 *
 * @param o
 * @returns {boolean}
 */
export function isFunction(o:any):o is Function {
  return typeof o === 'function'
}

/**
 * is string
 *
 * @param o
 * @returns {boolean}
 */
export function isString(o:any):o is String {
  return typeof o === 'string'
}


export function isPromise(o:any):o is Promise<any> {
  return o instanceof Promise || (o && isFunction(o.then))
}

/**
 * Is array type guard
 *
 * @param o
 */
export function isArray<T>(o:any|Array<T>):o is Array<T> {
  return Array.isArray(o)
}
