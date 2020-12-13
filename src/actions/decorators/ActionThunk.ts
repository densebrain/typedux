import {ActionOptions} from "../ActionTypes"
import { actionDecorator } from "./actionDecorator"

/**
 * Method decorator for actions
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionThunk(options:ActionOptions = {}) {
  return actionDecorator(options)
}

