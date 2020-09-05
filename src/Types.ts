//import { State } from "./reducers/State"

import { State } from "./reducers/State"

export type MapMerge<FromMap extends {} = {}> = FromMap & {}

export type LeafActionMap<
  FromMap extends MapMerge
> = {
  [Name in keyof FromMap]:
  (
    FromMap[Name] extends ((state: infer State, actions: infer Actions, ...args: infer Args) => infer R) ?
      ((state: State, actions: Actions, ...args:Args) => R) :
      never
    )
}

export type LeafBoundActionMap<
  FromMap extends LeafActionMap<{}>
> = {
  [Name in keyof FromMap]:
  (
    FromMap[Name] extends ((state: any, actions: any, ...args: infer Args) => infer R) ?
      ((...args:Args) => R) :
      never
    )
}

export type RootActionMap<NewLeaf = undefined, NewActions = {}, FromNS extends RootActionMap = {}> =
  FromNS &
  (NewLeaf extends string ? Record<NewLeaf,LeafActionMap<NewActions>> : {})


export type LeafOptions<LeafState, LeafActions extends LeafActionMap<{}> = unknown> = {
  stateConstructor?: new () => LeafState
  actions?: LeafActions
}