import type { ObservableStore } from "../store/ObservableStore"
import type { Dispatch } from "redux"
import type { State, TRootState } from "../reducers"

import type {
  ActionFactory,
  ActionFactoryConstructor,
  ActionFactoryDecorator,
  ActionFn,
  ActionMessage,
  ActionOptions,
  ActionRegistration,
  DispatchState,
  GetStoreState
} from "./ActionTypes"

import { Option } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import { makeId } from "../util/IdGenerator"
import { InternalState } from "../internal/InternalState"
import { INTERNAL_KEY } from "../Constants"

// const
// 	_cloneDeep = require('lodash.cloneDeep')

const log = getLogger(__filename)

export interface ActionInterceptorNext {
  (): any
}

export interface ActionInterceptor {
  (reg: ActionRegistration, next: ActionInterceptorNext, ...args: any[]): any
}

/**
 * Create a fully qualified action type
 *
 * @param leaf
 * @param type
 *
 * @returns {string}
 */
export function createLeafActionType(leaf: string, type: string) {
  return type.indexOf(".") > -1 ? type : `${leaf}.${type}`
}

export function createActionRegistration<
  A extends ActionFactory,
  F extends ActionFactoryConstructor<A> = ActionFactoryConstructor<A>,
  K extends string | A["leaf"] = A["leaf"]
>(
  actionFactoryCtor: F,
  leaf: string | K,
  type: string,
  action: ActionFn,
  options: ActionOptions<F> = {}
): ActionRegistration {
  return {
    type,
    fullName: createLeafActionType(leaf as string, type),
    leaf,
    options,
    actionFactoryCtor,
    action: (decorator: ActionFactoryDecorator, ...args) => {
      let actions = decorator ? decorator(actionFactoryCtor) : null
      if (!actions) {
        const newFactory = options.factoryCtor || actionFactoryCtor
        actions = new newFactory()
      }

      return action.apply(actions, args)
    }
  }
}
let globalStore: ObservableStore<any>
// /**
//  * Reference to a dispatcher
//  */
// let dispatch:DispatchState
//
// /**
//  * Reference to store state
//  */
// let getStoreState:GetStoreState

export const getGlobalStore = () => globalStore

export const getGlobalStoreState = () => getGlobalStore()?.getState()

const globalDispatchProvider = (<A extends ActionMessage<any>>(action: A) =>
  Option.ofNullable(globalStore)
    .map(store => store.dispatch(action))
    .getOrThrow(`Invalid store`)) as Dispatch<any>

/**
 * Get the current store state get
 * function - usually set when a new state is created
 *
 * @returns {GetStoreState}
 */
export function getGlobalStateProvider<S extends State = any>(): GetStoreState<
  S
> {
  return getGlobalStoreState
}

/**
 * Get the current store
 * dispatch function
 *
 * @returns {DispatchState}
 */
export function getGlobalDispatchProvider(): DispatchState {
  return globalDispatchProvider
}

/**
 * Get the stores internal state
 *
 * @returns {GetStoreState|any}
 */
export function getGlobalStoreInternalState(): InternalState {
  return Option.ofNullable(getGlobalStoreState())
    .map(state => state[INTERNAL_KEY])
    .getOrUndefined()
}

/**
 * Set the global store provider
 *
 * @param newStore
 */
export function setGlobalStore<Store extends ObservableStore>(newStore: Store) {
  if (!newStore && process.env.NODE_ENV === "development") {
    console.warn(`You are setting the global store to null`)
  }

  // Cast the guarded type
  globalStore = newStore
}

export class ActionContainer {
  registeredActions: { [actionType: string]: ActionRegistration } = {}

  actionInterceptors: ActionInterceptor[] = []

  constructor(public store: ObservableStore<any>) {}

  /**
   * Add an interceptor
   *
   * @param interceptor
   * @returns {()=>undefined}
   */
  addActionInterceptor(interceptor: ActionInterceptor) {
    const { actionInterceptors } = this
    actionInterceptors.push(interceptor)

    return () => {
      const index = actionInterceptors.findIndex(o => interceptor === o)
      if (index > -1) actionInterceptors.splice(index, 1)
    }
  }

  /**
   * Execute an interceptor at a specific index
   *
   * @param index
   * @param reg
   * @param actionId
   * @param action
   * @param args
   * @returns {any}
   */
  executeActionInterceptor(
    index: number,
    reg: ActionRegistration,
    actionId: string,
    action: Function,
    args: any[]
  ) {
    const { actionInterceptors, store } = this

    if (actionInterceptors.length > index) {
      return actionInterceptors[index](
        reg,
        () => {
          return this.executeActionInterceptor(
            index + 1,
            reg,
            actionId,
            action,
            args
          )
        },
        ...args
      )
    } else {
      return action(actionId, ...args)
    }
  }

  /**
   * Execute a given action chain
   *
   * @param reg
   * @param actionFn
   * @param args
   * @returns {any|any}
   */
  executeActionChain(
    reg: ActionRegistration,
    actionFn: Function,
    ...args: any[]
  ) {
    return this.executeActionInterceptor(0, reg, makeId(), actionFn, args)
  }

  /**
   * Register an action from a decoration usually
   *
   * @param reg
   * @return {ActionRegistration}
   */

  registerAction<
    A extends ActionFactory,
    F extends ActionFactoryConstructor<A> = ActionFactoryConstructor<A>,
    K extends A["leaf"] = A["leaf"]
  >(reg: ActionRegistration): ActionRegistration {
    this.registeredActions[reg.fullName] = reg

    return reg
  }

  /**
   * Retrieve a registered leaf action
   *
   * @param leaf
   * @param type
   * @returns {ActionRegistration}
   */
  getAction(leaf: string, type: string): ActionRegistration {
    return this.registeredActions[createLeafActionType(leaf, type)]
  }

  getAllActions() {
    return this.registeredActions // _cloneDeep(registeredActions)
  }
}
