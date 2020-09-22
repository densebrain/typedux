

export {default as Bluebird} from 'bluebird'

// import {Deferred} from "@3fv/deferred"
//
// export class PromiseEx<T> extends Bluebird<T> {
//
//   //static delay = Deferred.delay
// }
//
// const PromiseEx = Object.assign(cloneDeep(Promise), {
//   defer
// })

/**
 * Wrap action function so compiler allows it
 *
 * @param fn
 * @constructor
 */
export function Promised<T,Args extends any[]>(fn:(...args:Args) => T | Promise<T>):Promise<T> {
  return ((...args:Args) => {
    return fn(...args)
  }) as any
}
