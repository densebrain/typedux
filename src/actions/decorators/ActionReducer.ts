import {ActionOptions} from "../ActionTypes"
import { actionDecorator } from "./actionDecorator"

/**
 * An action that returns a reducer function
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionReducer(options:ActionOptions = {}) {
  return actionDecorator(Object.assign({}, options, {isReducer: true}))
}
