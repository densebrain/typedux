import {getLogger} from "@3fv/logger-proxy"

const log = getLogger(__filename)

/**
 * Mark a property as enumerable - or not
 *
 * @param value
 * @returns {function(any, string, PropertyDescriptor): undefined}
 * @constructor
 */
export function Enumerable(value:boolean) {
  return function (target:any, propertyKey:string, descriptor:PropertyDescriptor) {
    descriptor.enumerable = value
  }
}

export interface SelfTyped<T> {
  new(): T
}
