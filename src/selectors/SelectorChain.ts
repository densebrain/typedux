
import {State} from "../reducers/State"
import {
  PropChainType,
  continuePropertyChain,
  PropChainCallback,
  PropChainDataAccessor,
  PropChainDataWrapper
} from "../util/PropertyChain"
import {Selector, InferredSelector, SelectorSubscriptionListener} from "./SelectorTypes"
import { isNumber } from "@3fv/guard";
import * as _ from 'lodash'
import {ObservableStore} from "../store/ObservableStore"

// export type SelectorChainType<S,T> = Exclude<SelectorChainType<S, T>, SelectorChainDataAccessor<S,T>> & {
//   (): Selector<S,T>
// }

/**
 * `SelectorChainObjectWrapper` gives TypeScript visibility into the properties of
 * an `SelectorChainType` object at compile-time.
 */
type SelectorChainObjectWrapper<S, T> = { [K in keyof T]-?:SelectorChainType<S, T[K]> };

/**
 * Data accessor interface to dereference the value of the `TSOCType`.
 */
// export interface SelectorChainDataAccessor<S, T> {
//   /**
//    * Data accessor without a default value. If no data exists,
//    * `undefined` is returned.
//    */<Callback extends SelectorChainCallback<S, T>>(callback:Callback):SelectorChainOnFinish<S, T, Callback>;
//
//   /**
//    * Data accessor with default value.
//    */
//   // (defaultValue:NonNullable<T>):NonNullable<T>;
//   //
//   // (nullDefaultValue:T extends null ? null : never):Defined<T>; // Null case
// }

/**
 * `SelectorChainArrayWrapper` gives TypeScript visibility into the `SelectorChainType` values of an array
 * without exposing Array methods (it is problematic to attempt to invoke methods during
 * the course of an optional chain traversal).
 */
export interface SelectorChainArrayWrapper<S, T extends SelectorChainCallback<S, T | number>> {
  length:SelectorChainType<S, number>;
  
  [K:number]:SelectorChainType<S, T>;
}

/**
 * Data accessor interface to dereference the value of an `any` type.
 * @extends SelectorChainDataAccessor<any>
 */
export interface SelectorChainAny<S> extends SelectorChainDataAccessor<S, any>  {
  [K:string]:SelectorChainAny<S> // Enable deep traversal of arbitrary props
}

/**
 * `SelectorChainDataWrapper` selects between `SelectorChainArrayWrapper`, `SelectorChainObjectWrapper`, and `SelectorChainDataAccessor`
 * to wrap Arrays, Objects and all other types respectively.
 */
export type SelectorChainDataWrapper<S, T> =
  0 extends (1 & T) // Is T any? (https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360)
    ? (SelectorChainAny<S> & SelectorChainDataAccessor<S, T>)
    : T extends any[] // Is T array-like?
    ? SelectorChainArrayWrapper<S, T[number]>
    : T extends object // Is T object-like?
      ? SelectorChainObjectWrapper<S, T>
      : SelectorChainDataAccessor<S, T>

// /**
//  * An object that supports optional chaining
//  */
export type SelectorChainType<S, T> =
  (SelectorChainDataAccessor<S, T>
    & SelectorChainDataWrapper<S, NonNullable<T>>)

export type SelectorChainOnFinish<S, T, Callback extends SelectorChainCallback<S, T>> =
  ReturnType<Callback> extends ((...args:infer P) => (infer R)) ? ((...args:P) => R) : never



export interface SelectorChainDataAccessor<S,T> {
  (): Selector<S,T>
}

export interface SelectorChainCallback<S,T> {
  <T>(getter: (state: S) => T, keyPath: Array<string | number>):
    SelectorChainDataAccessor<S,T>
}

function continueSelectorChain<
  S,
  T
>(
  store: ObservableStore<any>,
  state:S,
  data:T,
  keyPath:Array<string | number> = []
): SelectorChainType<S,T> {//SelectorChainType<S,T> {
  keyPath = keyPath || []
  // noinspection DuplicatedCode
  const nextSelector = (():Selector<S,T> => {
  
    // TRACK FIRST PROP ACCESS
    const firstGet = keyPath.map(() => true)
  
    // CHECK IF KEY SHOULD BE NUMBER
    function resolveKey(value, key, index) {
      if (firstGet[index]) {
        if (Array.isArray(value)) {
          const keyNum = _.toNumber(key)
          if (isNumber(keyNum)) {
            key = keyPath[index] = keyNum
          }
        }
        firstGet[index] = false
      }
    
      return key
    }
  
    function getterFn(state:S) {
      return keyPath.reduce((value, key, index) => {
        return value[resolveKey(value, key, index)]
      }, state) as any
    }
    const getter:Selector<S,T> = Object.assign(getterFn, {
      subscribe(
        listener: SelectorSubscriptionListener<T>
      ) {
        return  store.observe(getterFn, listener)
      }
    })
    
    return getter as Selector<S,T> // overrideCallback(getter, keyPath)
  }) as SelectorChainDataAccessor<S,T>
  
  return (new Proxy(
    nextSelector,
    {
      get: (target, key) => {
        return continueSelectorChain(store,state, undefined, [...keyPath, key as any])
      }
    }
  )) as SelectorChainType<S, T>
  
}

export type SelectorChain<S> = SelectorChainType<S, S>
  //PropChainType<S, S,SelectorChainDataAccessor<S,S>>

export function selectorChain<
  S
>(
  store: ObservableStore<any>,
  state:S
): SelectorChain<S> {
  return continueSelectorChain<S,S>(store, state, state)
}
