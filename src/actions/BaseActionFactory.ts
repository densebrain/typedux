import type { ObservableStore } from "../store"

import { Option } from "@3fv/prelude-ts"
import { Enumerable, isNotEmpty } from "../util"
import type {
  ActionMessage,
  ActionFactory,
  ActionRegistration
} from "./ActionTypes"
import { getGlobalStore, createLeafActionType } from "./Actions"
import { getLogger } from "@3fv/logger-proxy"
import type {Reducer, State, StateConstructor, StateKey, RootState} from "../reducers"
import type { Action, Dispatch, Store } from "redux"
import * as ID from "shortid"
import {isDefined, isFunction} from "@3fv/guard"
import * as Immutable from "immutable"
import {clone, uniqBy } from "lodash"
import {isDev} from "../dev"

const log = getLogger(__filename)

/**
 * Base class for action implementations for a given state
 *
 */
abstract class BaseActionFactory<
  S extends State = State,
  M extends ActionMessage<S> = ActionMessage<S>,
  K extends StateKey<S> = StateKey<S>,
  RS extends RootState & {[key in K]: S} = RootState & {[key in K]: S}
> implements ActionFactory<S, M, K> {
  
  protected actionMap:Map<string, ActionRegistration<S, any>>

  protected store: ObservableStore<RS>

  readonly stateType: StateConstructor<S, K>

  private pushStoreActions() {
    Option.ofNullable(this.store?.actionContainer)
      .ifSome(actions => {
        this.actions.forEach(actions.registerAction.bind(actions))
      })
  }
  
  /**
   * @inheritDoc
   */
  get actions() {
    return uniqBy([...this.actionMap.values()], ({fullName}) => fullName)
  }

  /**
   * @inheritDoc
   */
  getAction(fullName: string)
  
  /**
   * @inheritDoc
   */
  getAction(leaf: string, type: string)
  getAction(leafOrFullName: string, type?:string) {
    return [leafOrFullName, createLeafActionType(leafOrFullName, type)]
      .map(key =>  this.actionMap.get(key))
      .filter(isDefined)[0]
      
  }
  
  /**
   * @inheritDoc
   */
  registerAction(reg: ActionRegistration): ActionRegistration {
    const map = this.actionMap = this.actionMap ?? new Map<string, ActionRegistration<S, this>>()
    Array(reg.fullName, reg.type)
      .forEach(key => map.set(key, reg))
    
    this.pushStoreActions()
    return reg
  }

  /**
   * Create a new action factory that consumes and produces a specific
   * state type
   *
   * @param stateType
   * @param withStore
   */
  protected constructor(
    stateType: StateConstructor<S, K>,
    withStore: ObservableStore = undefined
  ) {
    if (log.isDebugEnabled() && isDev) {
      log.debug(`Created action factory with state type: ${stateType.name}`)
    }
    this.stateType = stateType
    this.store = withStore
    
    this.pushStoreActions()
  }

  getStore() {
    return this.store ?? BaseActionFactory.clazzStore ?? getGlobalStore()
  }

  /**
   * The leaf served by this implementation
   */
  abstract leaf(): K

  /**
   * Get the current dispatcher
   *
   * Implemented for the purpose of thunks
   * etc where the dispatcher can be augmented
   *
   * @returns {Function|(function(any): any)}
   */

  get dispatcher(): Dispatch<ActionMessage<S>> {
    const store = this.getStore()

    if (!store || !isFunction(store.dispatch)) {
      throw new Error("Global dispatcher must be set before any actions occur")
    }

    return (<A extends Action>(action: A) =>
      store.dispatch<A>(action)) as Dispatch<any>
  }

  /**
   * Retrieve the current state using the global
   * getState or the augmented one
   *
   * directly applicable to @see dispatcher
   *
   * @returns instance of the state supported by this factory
   */
  get state(): S {
    const store = this.getStore()
    //const getStoreState = getGlobalStateProvider()
    const state = store?.getState()

    if (!state) return null

    const leaf = this.leaf()
    return !leaf
      ? state
      : Immutable.Map.isMap(state)
      ? state.get(leaf)
      : state[leaf]
  }

  /**
   * withDispatcher creates a new instance of
   * this action implementation with a
   * new dispatcher and optionally a new
   * getState
   *
   * @returns {any}
   * @param newStore
   */
  withStore(newStore: ObservableStore<any>): this {
    let instance = clone(this)

    instance.setStore(newStore)
    
    return instance
  }

  /**
   * Set the store for action factory
   *
   * @param newStore
   * @return {this<S, M>}
   */
  setStore(newStore: ObservableStore<any>) {
    this.store = newStore
    this.pushStoreActions()
    return this
  }

  /**
   * Create a new action message object that
   * fits the shape defined by the generic M
   *
   * @param id
   * @param type
   * @param reducers
   * @param data
   * @param args
   * @param leaf
   */

  newMessage(
    id: string,
    leaf: string,
    type: string,
    reducers: Reducer<S, ActionMessage<S>>[] = [],
    args: any[] = [],
    data = {}
  ): M {
    return Object.assign(
      {
        id: Option.ofNullable(id)
          .filter(isNotEmpty)
          .getOrCall(() => ID.generate()),
        leaf,
        type: createLeafActionType(this.leaf(), type),
        reducers,
        args,
        stateType: this.stateType
      },
      data
    ) as any
  }

  /**
   * setError action applies to all states
   *
   * @param error
   */
  //@ActionThunk()
  setError(error: Error) {}
}

namespace BaseActionFactory {
  export let clazzStore: ObservableStore<any>

  export function setStore(newClazzStore: ObservableStore<any>) {
    clazzStore = newClazzStore
  }
}

export { BaseActionFactory }
