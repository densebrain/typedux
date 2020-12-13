import {ActionOptions} from "../ActionTypes"
import { actionDecorator } from "./actionDecorator"


/**
 * Action that returns a promise factory function
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionPromise(options:ActionOptions = {}) {
  return actionDecorator(Object.assign({}, options, {isPromise: true}))
}
