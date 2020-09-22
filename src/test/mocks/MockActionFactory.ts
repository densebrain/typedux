import {BaseActionFactory} from "../../actions/BaseActionFactory"
import {MockKey} from "./MockConstants"
import {ActionReducer, ActionThunk} from "../../actions/ActionDecorations"
import {Bluebird as Promise, Promised} from "../../util"
import { MockLeafState } from "./MockLeafState"
import type { MockMessage } from "./MockMessage"
import type { IMockState } from "./MockState"
import type { ObservableStore } from "../../store/ObservableStore"

export class MockActionFactory extends BaseActionFactory<MockLeafState,MockMessage> {
  
  constructor(store?: ObservableStore<any>) {
    super(MockLeafState,store)
  }
  
  leaf(): typeof MockKey {
    return MockKey;
  }
  
  
  
  @ActionReducer()
  mockUpdate(val:string) {
    return (state:IMockState) => ({...state, str1: val})
  }
  
  @ActionReducer()
  mockUpdateFromState(newVal:string) {
    return (state:Map<string,any>) => ({...state, str2: newVal})
  }
  
  @ActionThunk()
  mockThunk() {
    return Promised((dispatch,getState) => {
      return Promise.delay(1000).then(() => "mock")
    })
  }
  
  @ActionThunk()
  mockThunkError() {
    return Promised((dispatch,getState) => {
      return Promise.delay(1000).then(() => {
        throw new Error('MockThunkErrorTest')
      })
    })
  }
}
