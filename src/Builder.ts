import { isString } from "@3fv/guard"
import {State, TRootState} from "./reducers/State"
import { LeafActionMap, RootActionMap } from "./Types"


export class TypeduxBuilder<
 S extends State,
  ActionMap extends RootActionMap
> {
  
  
  constructor(
    public actionNS:ActionMap = {} as any
  ) {
  
  }
  
  withLeaf<NewActions extends LeafActionMap<S>>(newActions:NewActions) {
}
  withActions<Leaf, NewActions extends object>(leaf: Leaf, newActions: NewActions) {
    return isString(leaf) ? new TypeduxBuilder<S, RootActionMap<Leaf, LeafActionMap<NewActions>, ActionMap>>({
        ...this.actionNS,
      [leaf]: newActions
      }as RootActionMap<Leaf, LeafActionMap<NewActions>, ActionMap>) : this
  }
  
}

export function createBuilder<S extends TRootState>(): TypeduxBuilder<S, {}> {
  return new TypeduxBuilder()
}