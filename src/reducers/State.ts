import * as Immutable from "immutable"
import { clone } from "lodash"

export type StateKey<S extends State> =   S extends State<infer K> ? (K extends string ? (K & keyof any) : never) : never

export type StateArgs = keyof any | State | StateConstructor<any>

// export type ObjectType<T extends {}, K extends keyof T = keyof T, V extends T[K] = T[K]> = [K,V]

export type ObjectAsMap<
  T extends {},
  K extends keyof T = keyof T,
  V extends T[K] = T[K]
> = Immutable.Map<K, V>

export interface StateConstructor<
  S extends State,
  Key extends StateKey<S> = StateKey<S>
> {
  readonly Key: Key
  new (o?: Partial<S>): S
  fromJS?: (o: Partial<S>) => S
}

//, K extends string = string
export interface State<T extends string = any> {
  readonly type: T
  
  toJS?: () => any
  //[key:string]:any
}

export interface RootState extends State, Record<string | number | symbol, any> {

}


/**
 * Function to patch an existing state
 *
 * @param {S} state
 * @param patches
 * @returns {S}
 */
export function patchState<
  S extends object = {},
  SP extends Partial<S> = Partial<S>
>(state: S, ...patches: Array<SP>): S {
  return Object.assign(clone(state), ...patches)
}
