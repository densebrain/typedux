import {ILeafReducer} from "../../reducers/LeafReducer"
import {State} from "../../reducers/State"
import {isFunction, isString} from "../../util/index"
import DumbReducer from "../../reducers/DumbReducer"
import {RootReducer} from "../../reducers/index"
import { getValue } from "@3fv/guard"
import {ObservableStore} from "../../store/ObservableStore"


/**
 * Make root reducer
 *
 * @param store
 * @param leafReducersOrStates
 * @param store
 * @param leafReducersOrStates
 */
export function createMockRootReducer(store: ObservableStore<any>,...leafReducersOrStates:Array<ILeafReducer<any,any>|State>) {
  let
    leafReducers = leafReducersOrStates.filter(it => isFunction(getValue(() => (it as any).leaf))) as Array<ILeafReducer<any,any>>,
    leafStates = leafReducersOrStates.filter(it => !isFunction(getValue(() => (it as any).leaf)) && isString(getValue(() => (it as any).type))) as Array<State>
  
  leafReducers = [...leafReducers, ...leafStates.map(state => new DumbReducer(state))]
  
  return new RootReducer(store, null,...leafReducers)
}
