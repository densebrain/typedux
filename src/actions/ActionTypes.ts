import type { Action } from "redux"
import type { Reducer } from "../reducers"
import type { ObservableStore } from "../store/ObservableStore"
import type { State, StateConstructor, StateKey } from "../reducers"
import type { Dispatch } from "redux"


// Internal type definition for
// function that gets the store state
export type GetStoreState<S extends State = any> = () => S
export type DispatchState<A extends ActionMessage<any> = any> = Dispatch<A>

export type ActionFactoryDecorator = <T extends ActionFactory>(factoryCtor:ActionFactoryConstructor<T>) => T
export type ActionFn<Args extends any[] = any[]> = (...args: Args) => any


export interface ActionRegistration<S extends State = State, F extends ActionFactory<S> = ActionFactory<S>, Fn extends ActionFn<any> = ActionFn<any>> {
  type:string
  fullName:string
  leaf: string | F["leaf"]
  action:Fn
  options:ActionOptions<ActionFactoryConstructor<F>>
  actionFactoryCtor: ActionFactoryConstructor<F>
}


export type ActionOptions<A extends ActionFactoryConstructor<any> = ActionFactoryConstructor<any>> = {
  isPromise?:boolean
  isReducer?:boolean
  factoryCtor?: A
  reducers?:Reducer<any, any>[]
  mapped?:string[]
}


/**
 * Action factory provider
 */
export type ActionFnProvider<T> = (...args:any[]) => (dispatch, getState) => T

/**
 * Action reducer provider
 */
export type ActionReducerProvider<S> = (...args:any[]) => (state:S) => S


/**
 * Action provider
 */
export type ActionProvider<T, S> = ActionFnProvider<T> | ActionReducerProvider<S>


export interface ActionFactory<
  S extends State = any,
  M extends ActionMessage<S> = ActionMessage<S>,
  K extends StateKey<S> = StateKey<S>
> {
  
  /**
   * Currently assigned store, fallback to global
   * if set
   */
  readonly getStore: () => ObservableStore
  
  /**
   * Get the state constructor
   */
  readonly stateType: StateConstructor<S, K>
  
  /**
   * Get the leaf key
   */
  readonly leaf: () => string | K
  
  /**
   * Get all currently registered actions
   */
  readonly actions: ActionRegistration[]
  
  
  
  /**
   * Get action by name
   *
   * @param fullName - full name or type
   */
  getAction(fullName: string)
  
  /**
   * Get action by parts
   *
   * @param leaf
   * @param type
   */
  getAction(leaf: string, type: string)
  
  
  readonly dispatcher: Dispatch<ActionMessage<S>>
  readonly state: S
  
  /**
   * Register an action.  Registrations
   * are used for store binding and
   * message generation, should not be
   * used directly
   *
   * @param reg
   */
  readonly registerAction: (reg: ActionRegistration) => ActionRegistration

  readonly withStore: (newStore: ObservableStore<any>) => this

  readonly setStore: (newStore: ObservableStore<any>) => this

  readonly newMessage: (
    id: string,
    leaf: string,
    type: string,
    reducers?: Reducer<S, ActionMessage<S>>[],
    args?: any[],
    data?: any
  ) => M
  
  
}

export interface ActionFactoryConstructor<
  Clazz extends ActionFactory<any, any>,
  S extends Clazz["state"] = Clazz["state"]
> {
  setStore: (store: ObservableStore<any>) => void

  new (store?: ObservableStore): Clazz
}

export interface ActionMessage<S extends State> extends Action {
  id?: string
  leaf?: string | S["type"]
  type: string
  stateType: StateConstructor<S>
  args?: any[]
  reducers?: Reducer<S, ActionMessage<S>>[]
  error?: Error
}

export enum ActionStatus {
  Started = 1,
  Finished = 2
}

export interface PendingAction {
  id: string
  leaf: string
  name: string
  status: ActionStatus
}
