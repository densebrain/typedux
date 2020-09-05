import {isString} from "@3fv/guard"
import {State, RootState} from "./reducers/State"
import {LeafActionMap, RootActionMap, LeafOptions} from "./Types"


export class TypeduxBuilder<MergedRootState extends RootState,
  MergedRootActionMap extends RootActionMap> {
  
  
  constructor(
    public actions:MergedRootActionMap = {} as any,
    public stateConstructors:{ [LeafKey in keyof MergedRootState]:(new () => State<LeafKey>) } = {} as any
  ) {
  
  }

//   withLeaf<NewActions extends LeafActionMap<MergedRootState>>(newActions:NewActions) {
// }
  withLeafState<LeafKey, LeafState extends State<LeafKey>>(leafKey:LeafKey, leafStateConstructor?: new () => LeafState) {
    return this.withLeaf<LeafKey, LeafState, {}>(leafKey, {stateConstructor: leafStateConstructor})
  }
  
  withLeafActions<LeafKey, LeafActions extends LeafActionMap<{}>>(leafKey:LeafKey, leafActions:LeafActions) {
    return this.withLeaf<LeafKey, State<LeafKey>, LeafActions>(leafKey, {actions: leafActions})
  }
  
  withLeaf<LeafKey, LeafState extends State<LeafKey>, LeafActions extends LeafActionMap<{}>>(leafKey:LeafKey, leaf:LeafOptions<LeafState, LeafActions>) {
    return isString(leafKey) ? new TypeduxBuilder<MergedRootState & (LeafKey extends string ? { [leaf in LeafKey]:LeafState } : never),
      RootActionMap<LeafKey,
        LeafActionMap<LeafActions>,
        MergedRootActionMap>>(
      {
        ...this.actions,
        [leafKey]: leaf.actions || {}
      } as RootActionMap<LeafKey, LeafActionMap<LeafActions>, MergedRootActionMap>,
      {
        ...this.stateConstructors,
        [leafKey]: leaf.stateConstructor
      } as MergedRootState & (LeafKey extends string ? { [leaf in LeafKey]:LeafState } : never)
    ) : this
  }
  
}

export function createBuilder<MergedRootState extends RootState>():TypeduxBuilder<MergedRootState, {}> {
  return new TypeduxBuilder()
}