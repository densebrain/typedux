
import {State} from "../reducers/State"
import {
  PropChainType,
  continuePropertyChain,
  PropChainCallback,
  PropChainDataAccessor,
  PropChainDataWrapper
} from "../util/PropertyChain"
import { Selector, InferredSelector } from "./SelectorTypes";
import { isNumber } from "@3fv/guard";
import * as _ from 'lodash'

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
  state:S,
  data:T,
  keyPath:Array<string | number> = []
): SelectorChainType<S,T> {//SelectorChainType<S,T> {
  keyPath = keyPath || []
  // noinspection DuplicatedCode
  return (new Proxy(
    (():Selector<S,T> => {
      
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
      
      const getter:Selector<S,T> = (state:S) =>
        keyPath.reduce((value, key, index) => {
          return value[resolveKey(value, key, index)]
        }, state) as any
      
      return getter as Selector<S,T> // overrideCallback(getter, keyPath)
    }) as SelectorChainDataAccessor<S,T>,
    {
      get: (target, key) => {
        return continueSelectorChain(state, undefined, [...keyPath, key as any])
      }
    }
  )) as SelectorChainType<S, T>
  
}

export type SelectorChain<S> = SelectorChainType<S, S>
  //PropChainType<S, S,SelectorChainDataAccessor<S,S>>

export function selectorChain<
  S
>(
  state:S
): SelectorChain<S> {
  return continueSelectorChain<S,S>(state, state)
}

/*
import { Selector } from "./SelectorTypes";
import _get from "lodash/get"
// export type SelectorChainType<S,T> = Exclude<PropChainType<S, T>, PropChainDataAccessor<S,T>> & {
//   (): Selector<S,T>
// }


export type SelectorChainDataAccessor<S,T> = () => (getter?: ((state: S) => T), keyPath?: Array<string | number>) => T
// {
//   (): Selector<S extends State<any> ? S : never,T>
// }
export interface SelectorChainCallback<S,T> {
  (getter: (state: S) => T, keyPath: Array<string | number>):
    SelectorChainDataAccessor<S,T>
  //() => Selector<S extends State<any> ? S : never,T>
}

//export type SelectorChainType<S,T> = PropChainDataWrapper<S, NonNullable<T>> & SelectorChainDataAccessor<S,T>
function continueSelectorChain<
  S,
  T
  >(
  state:S,
  data:T,
  keyPath:Array<string | number> = []
): PropChainType<S,T,SelectorChainDataAccessor<S,T>> {//SelectorChainType<S,T> {
  keyPath = keyPath || []
  return continuePropertyChain<
    S,
    T,
    SelectorChainCallback<S,T>,
    SelectorChainDataAccessor<S,T>>(
    state,data, keyPath,
    (getter: (state: S) => T, keyPath: Array<string | number>) =>
      () => state => !!getter ? getter(state as any) : _get(state, keyPath)
  
  )
  
  // return (new Proxy(
  //   continuePropertyChain<S,T,any>(state,data, keyPath, continueSelectorChain),
  //   {
  //     apply(target, thiz, args) {
  //       return target((getter, keyPath) => {
  //
  //         return (state: S) => getter(state)
  //       })
  //     }
  //     // <Callback extends PropChainCallback<S, T>>(callback:Callback) => {
  //     //
  //     //   // TRACK FIRST PROP ACCESS
  //     //   const firstGet = [...keyPath.map(() => true)]
  //     //
  //     //   // CHECK IF KEY SHOULD BE NUMBER
  //     //   function resolveKey(value, key, index) {
  //     //     if (firstGet[index]) {
  //     //       if (Array.isArray(value)) {
  //     //         const keyNum = _.toNumber(key)
  //     //         if (isNumber(keyNum)) {
  //     //           key = keyPath[index] = keyNum
  //     //         }
  //     //       }
  //     //       firstGet[index] = false
  //     //     }
  //     //
  //     //     return key
  //     //   }
  //     //
  //     //   const getter = (state:S) =>
  //     //     keyPath.reduce((value, key, index) => {
  //     //       return value[resolveKey(value, key, index)]
  //     //     }, state)
  //     //
  //     //   return callback(getter, keyPath)
  //     // },
  //     // {
  //     //   get: (target, key) => {
  //     //     return (continueSelectorChain(state, undefined, [...keyPath, key as any]))
  //     //   }
  //     // }
  //   })) as SelectorChainType<S, T>
}

export type SelectorChain<S> = PropChainType<S, S,SelectorChainDataAccessor<S,S>>

export function selectorChain<
  S
  >(
  state:S
): SelectorChain<S> {
  return continueSelectorChain(state, state)
}

 */