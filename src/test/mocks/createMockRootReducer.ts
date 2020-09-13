import {ILeafReducer} from "../../reducers/LeafReducer"
import {State} from "../../reducers/State"
import {isFunction, isString} from "../../util/index"
import DumbReducer from "../../reducers/DumbReducer"
import {RootReducer} from "../../reducers/index"
import { getValue } from "@3fv/guard"


/**
 * Make root reducer
 *
 * @param {ILeafReducer<any, any>} leafReducers
 * @returns {RootReducer<State<any>>}
 */
export function createMockRootReducer(...leafReducersOrStates:Array<ILeafReducer<any,any>|State>) {
  let
    leafReducers = leafReducersOrStates.filter(it => isFunction(getValue(() => (it as any).leaf))) as Array<ILeafReducer<any,any>>,
    leafStates = leafReducersOrStates.filter(it => !isFunction(getValue(() => (it as any).leaf)) && isString(getValue(() => (it as any).type))) as Array<State>
  
  leafReducers = [...leafReducers, ...leafStates.map(state => new DumbReducer(state))]
  
  return new RootReducer(null,...leafReducers)
}
