import {getLogger} from "@3fv/logger-proxy"

import RootReducer, {RootReducerErrorHandler} from "../reducers/RootReducer"
// Vendor
import {
  Action as ReduxAction,
  AnyAction,
  createStore,
  Observable,
  Observer,
  PreloadedState,
  Reducer,
  Store,
  StoreEnhancer,
  Unsubscribe
} from "redux"
import "symbol-observable"
import {getValue} from "@3fv/guard"
import {isFunction, isString} from "../util"

import type {ILeafReducer, State, StateArgs} from "../reducers"
import type {ActionFactory, ActionFactoryConstructor, ActionMessage} from "../actions"
import {ActionContainer} from "../actions"

import StateObserver, {TStateChangeHandler} from "./StateObserver"
import {DefaultLeafReducer} from "../reducers/DefaultLeafReducer"
import {INTERNAL_KEY} from "../constants"
import {InternalState} from "../internal/InternalState"

import DumbReducer from "../reducers/DumbReducer"
import {selectorChain, SelectorChainType, SelectorFn} from "../selectors"
import _get from "lodash/get"
import {Option} from "@3fv/prelude-ts"

const log = getLogger(__filename)

export interface ObserverDisposer {
  (): void
}


export function processLeafReducersAndStates(
  leafReducersOrStates: Array<ILeafReducer<any, any> | State | Function>
) {
  const leafReducers = leafReducersOrStates.filter(it =>
      isFunction(getValue(() => (it as any).leaf))
    ) as Array<ILeafReducer<any, any>>,
    leafStates = leafReducersOrStates.filter(
      it =>
        !isFunction(getValue(() => (it as any).leaf)) &&
        isString(getValue(() => (it as any).type))
    ) as Array<State>,
    otherReducers = leafReducersOrStates.filter(it =>
      isFunction(it)
    ) as Array<ILeafReducer<any, any>>
  
  return [
    ...otherReducers,
    ...leafReducers,
    ...leafStates.map(state => new DumbReducer(state))
  ]
}

/**
 * Manage the redux store for RADS
 */
export class ObservableStore<S extends State = any> implements Store<S> {
  
  
  
  /**
   * Factory method for creating a new observable store
   *
   * @param enhancer
   * @returns {ObservableStore<S>}
   * @param rootStateType
   * @param defaultStateValue
   * @param leafReducersOrStates
   */
  static createObservableStore<S extends State>(
    leafReducersOrStates: Array<ILeafReducer<any, any> | State | Function>,
    enhancer: StoreEnhancer<any> = undefined,
    rootStateType: new () => S = undefined,
    defaultStateValue: any = undefined
  ): ObservableStore<S> {
    
    

    return new ObservableStore(
      leafReducersOrStates,
      enhancer,
      rootStateType,
      defaultStateValue
    )
  }

  /**
   * Create simple reducers
   *
   * @param {string | State} statesOrKeys
   * @returns {Array<State>}
   */
  static makeSimpleReducers<Args extends StateArgs[], S extends State = State>(
    ...statesOrKeys: Args
  ): Array<ILeafReducer<S>> {
    return statesOrKeys
      .map(state => (isString(state) ? { type: state } : (state as State)))
      .map(state => new DumbReducer(state))
  }

  /**
   * Create a internal reducer
   *
   * @returns {DefaultLeafReducer<InternalState, ActionMessage<InternalState>>}
   */
  static createInternalReducer() {
    return DefaultLeafReducer.create(INTERNAL_KEY, InternalState)
  }

  private rootReducer: RootReducer<S>

  private observers: Array<StateObserver<S, any>> = []
  private rootReducerFn
  private readonly store: Store<S>

  private readonly actionFactories = new Map<string, ActionFactory>()

  readonly actionContainer: ActionContainer
  
  
  
  constructor(
    leafReducersOrStates: Array<ILeafReducer<any, any> | State | Function>,
    enhancer: StoreEnhancer<ObservableStore<S>, unknown> = undefined,
    public rootStateType: new () => S = undefined,
    public defaultStateValue: any = undefined
  ) {
    this.actionContainer = new ActionContainer(this)

    this.createRootReducer(
      ObservableStore.createInternalReducer(),
      ...processLeafReducersAndStates(leafReducersOrStates)
    )

    this.store = createStore<S, AnyAction, ObservableStore<S>, unknown>(
      this.rootReducerFn,
      this.rootReducer.defaultState(defaultStateValue) as PreloadedState<S>,
      enhancer ?? ((next => next) as any)
    ) as Store<S>

    this.subscribe(() => this.scheduleNotification())
  }
  
  setOnError(onError: RootReducerErrorHandler) {
    this.rootReducer?.setOnError(onError)
    return this
  }
  
  /**
   * Get a prepared set of actions
   *
   * @param keyOrCtor - class name of class constructor to search for
   */
  getActions<A extends ActionFactory>(
    keyOrCtor: ActionFactoryConstructor<A> | string
  ): A {
    const key = isString(keyOrCtor) ? keyOrCtor : keyOrCtor.name
    return Option.ofNullable(this.actionFactories.get(key) as A).getOrCall(
      () => {
        if (isString(keyOrCtor)) {
          throw Error(`No registered actions with key: ${keyOrCtor}`)
        }

        const actions = new keyOrCtor(this as ObservableStore<any>)
        this.actionFactories.set(key, actions)
        return actions as A
      }
    )
  }

  /**
   * Create a new root reducer
   *
   * @param leafReducers
   * @returns {any}
   */
  private createRootReducer(...leafReducers: ILeafReducer<any, any>[]) {
    this.rootReducer = new RootReducer<S>(
      this,
      this.rootStateType,
      ...leafReducers
    )
    this.rootReducerFn = this.rootReducer.makeGenericHandler()

    return this.rootReducerFn
  }

  /**
   * Retrieve the redux store under everything
   *
   * @returns {any}
   */
  getReduxStore() {
    return this.store
  }

  /**
   * Update the reducers
   */
  replaceReducers(...leafReducers: ILeafReducer<any, any>[]): void {
    const rootReducerFn = this.createRootReducer(
      ObservableStore.createInternalReducer(),
      ...leafReducers
    )

    this.store.replaceReducer(rootReducerFn)
  }

  subscribe(listener: () => void): Unsubscribe {
    return this.getReduxStore().subscribe(listener)
  }

  replaceReducer(nextReducer: Reducer<S>): void {
    throw new Error("We don't play with no regular reducers ;)")
  }

  /**
   * Retrieve the current state
   * @returns {*}
   */
  getState(): S {
    return this.getReduxStore().getState()
  }

  getInternalState(): InternalState {
    return this.getState()[INTERNAL_KEY] as InternalState
  }

  /**
   * Dispatch typed message
   *
   * @param action
   * @returns {A|undefined|IAction}
   */
  dispatch<A extends ReduxAction>(action: A): A {
    return this.getReduxStore().dispatch(action)
  }

  /**
   * Schedule notifications to go out on next tick
   */
  scheduleNotification() {
    let state = this.getState()

    this.observers.forEach(listener => listener.onChange(state))
  }

  /**
   *
   */
  onChange() {
    this.scheduleNotification()
  }

  /**
   * Create a new selector from the store's state
   */
  selector<Chain extends SelectorChainType<S,S> = SelectorChainType<S,S>>(): Chain {
    return selectorChain<S>(this, null as S) as Chain
  }

  /**
   * Observe state path for changes
   *
   * @param selector
   * @param handler
   * @returns {function()} unsubscribe observer
   */
  observe<T>(
    selector: SelectorFn<S, T>,
    handler: TStateChangeHandler<S, T>
  ): ObserverDisposer

  /**
   * Observe state path for changes
   *
   * @param path
   * @param handler
   * @returns {function()} unsubscribe observer
   */
  observe<T = any>(
    path: string | string[],
    handler: TStateChangeHandler<S, T>
  ): ObserverDisposer
  observe<T = any>(
    pathOrSelector: SelectorFn<S, T> | string | string[],
    handler: TStateChangeHandler<S, T>
  ): ObserverDisposer {
    let selector: SelectorFn<S, T>

    if (isString(pathOrSelector) || Array.isArray(pathOrSelector)) {
      const keyPath = pathOrSelector
        ? Array.isArray(pathOrSelector)
          ? pathOrSelector
          : pathOrSelector.split(".")
        : []
      selector = ((state: S) => this.getValueAtPath<T>(state, keyPath)) as any
    } else {
      selector = pathOrSelector
    }

    let observer = new StateObserver(selector, handler)
    this.observers.push(observer)

    return () => {
      if (observer.removed) {
        log.debug("Already removed this observer", observer)
        return
      }

      this.observers.find((it, index) => {
        if (observer === it) {
          this.observers.splice(index, 1)
          return true
        }

        return false
      })

      observer.removed = true
    }
  }

  getValueAtPath<T>(state: S, keyPath: Array<string | number>): T {
    return _get(state, keyPath)
  }

  private observable = (): Observable<S> => {
    const store = this

    return {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer: Observer<S>) {
        if (typeof observer !== "object" || observer === null) {
          throw new TypeError("Expected the observer to be an object.")
        }

        function observeState() {
          if (observer.next) {
            observer.next(store.getState())
          }
        }

        observeState()
        const unsubscribe = store.subscribe(observeState)
        return { unsubscribe }
      },

      [Symbol.observable]: store.observable
    }
  };

  [Symbol.observable] = this.observable
}
