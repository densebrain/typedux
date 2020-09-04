import { State, TRootState } from "./reducers/State";
import { LeafActionMap, RootActionMap } from "./Types";
import {ILeafReducer} from "@3fv/typedux/reducers"
import {ObservableStore} from "@3fv/typedux/store"

export class Typedux<
  RS extends TRootState,
  NS extends RootActionMap<RS>
> {

  constructor(
    public readonly store: ObservableStore<RS>,
    public readonly actions: NS

  ) {
  
  }
  
}

