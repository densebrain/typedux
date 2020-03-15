import {State} from "../reducers"
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
 * `SelectorChainObjectWrapper` gives TypeScript visibility into the properties of
 * an `SelectorChainType` object at compile-time.
 */
type SelectorChainObjectWrapper<S extends State<string>, T> = { [K in keyof T]-?:SelectorChainType<S, T[K]> };

/**
 * Data accessor interface to dereference the value of the `TSOCType`.
 */
export interface SelectorChainDataAccessor<S extends State<string>, T> {
  /**
   * Data accessor without a default value. If no data exists,
   * `undefined` is returned.
   */
  (noDefaultValue?:undefined):Defined<T> | undefined;
  
  /**
   * Data accessor with default value.
   */
  (defaultValue:NonNullable<T>):NonNullable<T>;
  
  (nullDefaultValue:T extends null ? null : never):Defined<T>; // Null case
}

/**
 * `SelectorChainArrayWrapper` gives TypeScript visibility into the `SelectorChainType` values of an array
 * without exposing Array methods (it is problematic to attempt to invoke methods during
 * the course of an optional chain traversal).
 */
export interface SelectorChainArrayWrapper<S extends State<string>, T> {
  length:SelectorChainType<S, number>;
  
  [K:number]:SelectorChainType<S, T>;
}

/**
 * Data accessor interface to dereference the value of an `any` type.
 * @extends SelectorChainDataAccessor<any>
 */
export interface SelectorChainAny extends SelectorChainDataAccessor<any, any> {
  [K:string]:SelectorChainAny; // Enable deep traversal of arbitrary props
}

/**
 * `SelectorChainDataWrapper` selects between `SelectorChainArrayWrapper`, `SelectorChainObjectWrapper`, and `SelectorChainDataAccessor`
 * to wrap Arrays, Objects and all other types respectively.
 */
export type SelectorChainDataWrapper<S extends State<string>, T> =
  0 extends (1 & T) // Is T any? (https://stackoverflow.com/questions/49927523/disallow-call-with-any/49928360#49928360)
    ? SelectorChainAny
    : T extends any[] // Is T array-like?
    ? SelectorChainArrayWrapper<S, T[number]>
    : T extends object // Is T object-like?
      ? SelectorChainObjectWrapper<S, T>
      : SelectorChainDataAccessor<S, T>;

/**
 * An object that supports optional chaining
 */
export type SelectorChainType<S extends State<string>, T> =
  SelectorChainDataAccessor<S, T>
  & SelectorChainDataWrapper<S, NonNullable<T>>

/**
 * Optional chaining with default values. To inspect a property value in
 * a tree-like structure, invoke it as a function, optionally passing a default value.
 *
 * @example
 *   // Given:
 *   const x = oc<T>({
 *     a: 'hello',
 *     b: { d: 'world' },
 *     c: [-100, 200, -300],
 *   });
 *
 *   // Then:
 *   x.a() === 'hello'
 *   x.b.d() === 'world'
 *   x.c[0]() === -100
 *   x.c[100]() === undefined
 *   x.c[100](1234) === 1234
 *   x.c.map((e) => e()) === [-100, 200, -300]
 *   x.d.e() === undefined
 *   x.d.e('optional default value') === 'optional default value'
 *   (x as any).y.z.a.b.c.d.e.f.g.h.i.j.k() === undefined
 */
//export declare function oc<T>(data?: T): SelectorChainType<T>;
export function selector<S extends State<string>, T>(data?:T):SelectorChainType<S, T> {
  return new Proxy(
    ((defaultValue?:Defined<T>) => (data == null ? defaultValue : data)) as SelectorChainType<S, T>,
    {
      get: (target, key) => {
        const obj:any = target()
        return selector(typeof obj === "object" ? obj[key] : undefined)
      }
    }
  )
}
