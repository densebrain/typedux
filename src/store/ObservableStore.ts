import {getLogger} from "typelogger"


import RootReducer from "../reducers/RootReducer"
// Vendor
import {
  Action as ReduxAction,
  AnyAction,
  createStore,
  Observable,
  Observer,
  Reducer,
  Store,
  StoreEnhancer,
  Unsubscribe
} from "redux"
import "symbol-observable"
import {getValue} from "typeguard"
import {isFunction, isString, nextTick} from "../util"
import {ILeafReducer, State} from "../reducers"
import StateObserver, {TStateChangeHandler} from "./StateObserver"
import {DefaultLeafReducer} from "../reducers/DefaultLeafReducer"
import {INTERNAL_KEY} from "../Constants"
import {InternalState} from "../internal/InternalState"
import {ActionMessage} from "../actions/ActionTypes"
import DumbReducer from "../reducers/DumbReducer"
import {Selector, SelectorChain, selectorChain} from "../selectors"
import _get from "lodash/get"

const log = getLogger(__filename)


export interface IObserverCleaner {
  ():void
}

/**
 * Manage the redux store for RADS
 */
export class ObservableStore<S extends State<string>> implements Store<S> {
  
  /**
   * Factory method for creating a new observable store
   *
   * @param enhancer
   * @returns {ObservableStore<S>}
   * @param rootStateType
   * @param defaultStateValue
   * @param leafReducersOrStates
   */
  static createObservableStore<S extends State<string>>(
    leafReducersOrStates:Array<ILeafReducer<any, any> | State<string> | Function>,
    enhancer:StoreEnhancer<any> = null,
    rootStateType:{ new():S } = null,
    defaultStateValue:any = null
  ):ObservableStore<S> {
    let
      leafReducers = leafReducersOrStates.filter(it => isFunction(getValue(() => (it as any).leaf))) as Array<ILeafReducer<any, any>>,
      leafStates = leafReducersOrStates.filter(it => !isFunction(getValue(() => (it as any).leaf)) && isString(getValue(() => (it as any).type))) as Array<State<string>>,
      otherReducers = leafReducersOrStates.filter(it => isFunction(it)) as Array<ILeafReducer<any, any>>
    
    leafReducers = [...otherReducers, ...leafReducers, ...leafStates.map(state => new DumbReducer(state))]
    
    return new ObservableStore(leafReducers, enhancer, rootStateType, defaultStateValue)
  }
  
  /**
   * Create simple reducers
   *
   * @param {string | State<string>} statesOrKeys
   * @returns {Array<State<string>>}
   */
  static makeSimpleReducers(...statesOrKeys:Array<string | State<string>>):Array<ILeafReducer<State<string>, any>> {
    return statesOrKeys
      .map(state => isString(state) ? {type: state} : state as State<string>)
      .map(state => new DumbReducer(state))
  }
  
  /**
   * Create a internal reducer
   *
   * @returns {DefaultLeafReducer<InternalState, ActionMessage<InternalState>>}
   */
  static makeInternalReducer() {
    return DefaultLeafReducer.makeLeafReducer(INTERNAL_KEY, InternalState)
  }
  
  
  public rootReducer:RootReducer<S>
  private observers:Array<StateObserver<S, any>> = []
  private rootReducerFn
  private store:Store<S>
  private pendingTick
  
  constructor(
    leafReducers:ILeafReducer<any, any>[],
    enhancer:StoreEnhancer<ObservableStore<S>, unknown> = null,
    public rootStateType:{ new():S } = null,
    public defaultStateValue:any = null) {
    
    this.createRootReducer(...leafReducers)
    this.store = createStore<S, AnyAction, ObservableStore<S>, unknown>(
      this.rootReducerFn,
      this.rootReducer.defaultState(defaultStateValue),
      enhancer
    ) as Store<S>
    
    this.subscribe(() =>
      this.scheduleNotification()
    )
  }
  
  /**
   * Create a new root reducer
   *
   * @param leafReducers
   * @returns {any}
   */
  private createRootReducer(...leafReducers:ILeafReducer<any, any>[]) {
    this.rootReducer = new RootReducer(this.rootStateType, ...leafReducers)
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
  replaceReducers(...leafReducers:ILeafReducer<any, any>[]):void {
    const
      rootReducerFn = this.createRootReducer(
        ObservableStore.makeInternalReducer(),
        ...leafReducers
      )
    
    this.store.replaceReducer(rootReducerFn)
  }
  
  subscribe(listener:() => void):Unsubscribe {
    return this.getReduxStore().subscribe(listener)
  }
  
  replaceReducer(nextReducer:Reducer<S>):void {
    throw new Error("We don't play with no regular reducers ;)")
  }
  
  /**
   * Retrieve the current state
   * @returns {*}
   */
  getState():S {
    return this.getReduxStore().getState()
  }
  
  getInternalState():InternalState {
    return this.getState()[INTERNAL_KEY] as InternalState
  }
  
  /**
   * Dispatch typed message
   *
   * @param action
   * @returns {A|undefined|IAction}
   */
  dispatch<A extends ReduxAction>(action:A):A {
    return this.getReduxStore().dispatch(action)
  }
  
  
  /**
   * Schedule notifications to go out on next tick
   */
  scheduleNotification() {
    if (this.pendingTick) return
    
    this.pendingTick = nextTick(() => {
      let state = this.getState()
      
      this.pendingTick = null
      this.observers.forEach((listener) => listener.onChange(state))
    })
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
  selector():SelectorChain<S> {
    return selectorChain(null as S)
  }
  
  /**
   * Observe state path for changes
   *
   * @param selector
   * @param handler
   * @returns {function()} unsubscribe observer
   */
  observe<T>(selector:Selector<S, T>, handler:TStateChangeHandler<S, T>):IObserverCleaner
  
  /**
   * Observe state path for changes
   *
   * @param path
   * @param handler
   * @returns {function()} unsubscribe observer
   */
  observe<T = any>(path:string | string[], handler:TStateChangeHandler<S, T>):IObserverCleaner
  observe<T = any>(pathOrSelector:Selector<S, T> | string | string[], handler:TStateChangeHandler<S, T>):IObserverCleaner {
    let selector:Selector<S, T>
    
    if (isString(pathOrSelector) || Array.isArray(pathOrSelector)) {
      const keyPath = pathOrSelector ? ((Array.isArray(pathOrSelector)) ? pathOrSelector : pathOrSelector.split('.')) : []
      selector = (state:S) => this.getValueAtPath<T>(state, keyPath)
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
  
  getValueAtPath<T>(state:S, keyPath:Array<string | number>):T {
    let newValue = _get(state, keyPath)
    
    for (let key of keyPath) {
      if (!newValue) break
      
      let
        tempValue = (newValue.get) ? newValue.get(key) : null
      
      newValue = tempValue || newValue[key]
      
      //(this.keyPath.length > 0) ? state.getIn(this.keyPath) : state
    }
    
    return newValue as any
  }
  
  private observable = ():Observable<S> => {
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
      subscribe(observer:Observer<S>) {
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
        return {unsubscribe}
      },
	    
	    [Symbol.observable]: store.observable
    }
  }
  
  [Symbol.observable] = this.observable
}









