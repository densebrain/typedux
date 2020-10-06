import { isNumber, toNumber } from "@3fv/guard"

/**
 * Copyright (C) 2019-present, Rimeto, LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A generic type that cannot be `undefined`.
 */
export type Defined<T> = Exclude<T, undefined>

/**
 * `PropChainObjectWrapper` gives TypeScript visibility into the properties of
 * an `PropChainType` object at compile-time.
 */
export type PropChainObjectWrapper<S, T> = {
  [K in keyof T]-?: PropChainType<S, T[K]>
}

/**
 * Data accessor interface to dereference the value of the `TSOCType`.
 */
export interface PropChainDataAccessor<S, T> {
  /**
   * Data accessor without a default value. If no data exists,
   * `undefined` is returned.
   */
  <Callback extends PropChainCallback<S, T>>(
    callback: Callback
  ): PropChainOnFinish<S, T, Callback>
}

/**
 * `PropChainArrayWrapper` gives TypeScript visibility into the `PropChainType` values of an array
 * without exposing Array methods (it is problematic to attempt to invoke methods during
 * the course of an optional chain traversal).
 */
export interface PropChainArrayWrapper<
  S,
  T extends PropChainCallback<S, T | number>
> {
  length: PropChainType<S, number>

  [K: number]: PropChainType<S, T>
}

/**
 * Data accessor interface to dereference the value of an `any` type.
 * @extends PropChainDataAccessor<any>
 */
export interface PropChainAny<S> extends PropChainDataAccessor<S, any> {
  [K: string]: PropChainAny<S> // Enable deep traversal of arbitrary props
}

/**
 * `PropChainDataWrapper` selects between `PropChainArrayWrapper`, `PropChainObjectWrapper`, and `PropChainDataAccessor`
 * to wrap Arrays, Objects and all other types respectively.
 */
export type PropChainDataWrapper<S, T> = 0 extends 1 & T // Is T any? (https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360)
  ? PropChainAny<S> & PropChainDataAccessor<S, T>
  : T extends any[] // Is T array-like?
  ? PropChainArrayWrapper<S, T[number]>
  : T extends object // Is T object-like?
  ? PropChainObjectWrapper<S, T>
  : PropChainDataAccessor<S, T>

/**
 * An object that supports optional chaining
 */
export type PropChainType<S, T> = PropChainDataAccessor<S, T> &
  PropChainDataWrapper<S, NonNullable<T>>


export type PropChainCallback<S, T> = (
  getter: (state: S) => T,
  keyPath: Array<string | number>
) => any

/**
 * Callback returned by prop-chain
 */
export type PropChainOnFinish<
  S,
  T,
  Callback extends PropChainCallback<S, T>
> = ReturnType<Callback> extends (...args: infer P) => infer R
  ? (...args: P) => R
  : never


export function continuePropertyChain<
  S,
  T,
  Callback,
  DataAccessor
>(
  state: S,
  data: T,
  keyPath: Array<string | number> = []
): PropChainType<S, T> {
  keyPath = keyPath || []

  // noinspection DuplicatedCode
  return new Proxy(
    (overrideCallback: PropChainCallback<S, T>) => {
      // TRACK FIRST PROP ACCESS
      const firstGet = keyPath.map(() => true)

      // CHECK IF KEY SHOULD BE NUMBER
      function resolveKey(value, key, index) {
        if (firstGet[index]) {
          if (Array.isArray(value)) {
            const keyNum = toNumber(key)
            if (isNumber(keyNum)) {
              key = keyPath[index] = keyNum
            }
          }
          firstGet[index] = false
        }

        return key
      }

      const getter = (state: S) =>
        keyPath.reduce((value, key, index) => {
          return value[resolveKey(value, key, index)]
        }, state)

      return overrideCallback(getter, keyPath)
    },
    {
      get: (target, key) => {
        return continuePropertyChain(state, undefined, [...keyPath, key as any])
      }
    }
  ) as PropChainType<S, T>
}

/**
 * Start a new prop chain of the type specified
 *
 * @param state
 */
export function propertyChain<S>(state: S = undefined): PropChainType<S, S> {
  return continuePropertyChain<
    S,
    S,
    PropChainCallback<S, S>,
    PropChainDataAccessor<S, S>
  >(state, state)
}
