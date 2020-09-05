import { State, RootState } from "./reducers/State";
import { LeafActionMap, RootActionMap } from "./Types";
import {ILeafReducer} from "@3fv/typedux/reducers"
import {ObservableStore} from "@3fv/typedux/store"

export class Typedux<
  RS extends RootState,
  NS extends RootActionMap<RS>
> {

  constructor(
    public readonly store: ObservableStore<RS>,
    public readonly actions: NS

  ) {
  
  }
  
}

