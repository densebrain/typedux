import {State} from "reducers"
//import * as _ from 'lodash'
import {isNumber} from "@3fv/guard"
import _toNumber from "lodash/toNumber"

/**
 * Copyright (C) 2019-present, Rimeto, LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A generic type that cannot be `undefined`.
 */
type Defined<T> = Exclude<T, undefined>;

/**
 * `PropChainObjectWrapper` gives TypeScript visibility into the properties of
 * an `PropChainType` object at compile-time.
 */
type PropChainObjectWrapper<S, T, DataAccessor> = { [K in keyof T]-?:PropChainType<S, T[K], DataAccessor> };
//type PropChainObjectWrapper<S, T> = { [K in keyof T]-?:PropChainType<S, T[K]> };
/**
 * Data accessor interface to dereference the value of the `TSOCType`.
 */
export interface PropChainDataAccessor<S, T> {
  /**
   * Data accessor without a default value. If no data exists,
   * `undefined` is returned.
   */<Callback extends PropChainCallback<S, T>>(callback:Callback):PropChainOnFinish<S, T, Callback>;
  
  /**
   * Data accessor with default value.
   */
  // (defaultValue:NonNullable<T>):NonNullable<T>;
  //
  // (nullDefaultValue:T extends null ? null : never):Defined<T>; // Null case
}

/**
 * `PropChainArrayWrapper` gives TypeScript visibility into the `PropChainType` values of an array
 * without exposing Array methods (it is problematic to attempt to invoke methods during
 * the course of an optional chain traversal).
 */
export interface PropChainArrayWrapper<S, T extends PropChainCallback<S, T | number>, DataAccessor> {
  length:PropChainType<S, number, DataAccessor>;
  
  [K:number]:PropChainType<S, T, DataAccessor>;
}

/**
 * Data accessor interface to dereference the value of an `any` type.
 * @extends PropChainDataAccessor<any>
 */
export interface PropChainAny<S, DataAccessor =PropChainDataAccessor<S, any>>  {
  [K:string]:PropChainAny<S, DataAccessor> & DataAccessor // Enable deep traversal of arbitrary props
}

/**
 * `PropChainDataWrapper` selects between `PropChainArrayWrapper`, `PropChainObjectWrapper`, and `PropChainDataAccessor`
 * to wrap Arrays, Objects and all other types respectively.
 */
export type PropChainDataWrapper<S, T, DataAccessor = PropChainDataAccessor<S, T>> =
  0 extends (1 & T) // Is T any? (https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360)
    ? (PropChainAny<S> & DataAccessor)
    : T extends any[] // Is T array-like?
    ? PropChainArrayWrapper<S, T[number], DataAccessor>
    : T extends object // Is T object-like?
      ? PropChainObjectWrapper<S, T, DataAccessor>
      : DataAccessor

/**
 * An object that supports optional chaining
 */
export type PropChainType<S, T, DataAccessor = PropChainDataAccessor<S, T>> =
  (DataAccessor
    & PropChainDataWrapper<S, NonNullable<T>, DataAccessor>)
//| PropChainOnFinish<Callback>


export type PropChainCallback<S, T> = (getter:(state:S) => T, keyPath:Array<string | number>) => any

export type PropChainOnFinish<S, T, Callback extends PropChainCallback<S, T>> =
  ReturnType<Callback> extends ((...args:infer P) => (infer R)) ? ((...args:P) => R) : never

//
// export interface PropChainContinuation<
//   S,
//   T,
//   Callback
//   > {
//   (
//     state:S,
//     data:T,
//     keyPath?:Array<string | number> | undefined,
//     callback?: Callback | undefined,
//     continuation?: PropChainContinuation<S,T,Callback> | undefined
//   ):PropChainType<S, T>
// }

export function continuePropertyChain<
  S,
  T,
  Callback extends PropChainCallback<S,T>,
  DataAccessor extends PropChainDataAccessor<S,T>
  //Continuation extends PropChainContinuation<S,T,Callback> =
>(
  state:S,
  data:T,
  keyPath:Array<string | number> = [],
  callback: Callback = undefined
):PropChainType<S, T,DataAccessor> {
  keyPath = keyPath || []
  //continuation = continuation || continuePropertyChain as ChainContinuation
  
  return (new Proxy(
    (overrideCallback: Callback = callback) => {
      
      // TRACK FIRST PROP ACCESS
      const firstGet = keyPath.map(() => true)
      
      // CHECK IF KEY SHOULD BE NUMBER
      function resolveKey(value, key, index) {
        if (firstGet[index]) {
          if (Array.isArray(value)) {
            const keyNum = _toNumber(key)
            if (isNumber(keyNum)) {
              key = keyPath[index] = keyNum
            }
          }
          firstGet[index] = false
        }
        
        return key
      }
      
      const getter = (state:S) =>
        keyPath.reduce((value, key, index) => {
          return value[resolveKey(value, key, index)]
        }, state)
      
      return overrideCallback(getter, keyPath)
    },
    {
      // get: <
      //   Key extends (string | number),
      //   PropType extends (Key extends keyof T ? T[Key] : never)
      // >(target, key: Key) => {
      get: (target, key) => {
        return (continuePropertyChain(state, undefined, [...keyPath, key as any], callback))
      }
    })) as PropChainType<S, T,DataAccessor>

}

export function propertyChain<S>(
  state:S
):PropChainType<S, S> {
  return continuePropertyChain<S,S,PropChainCallback<S,S>, PropChainDataAccessor<S,S>>(state, state)
  //return continuePropertyChain<S,S>(state, state,[])
}
