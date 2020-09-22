import {ActionFactory} from "../../actions/ActionFactory"
import {MockKey} from "./MockConstants"
import {ActionReducer, ActionThunk, Promised} from "../../actions/ActionDecorations"
import {Bluebird as Promise} from "../../util"
import { MockLeafState } from "./MockLeafState"
import { MockMessage } from "./MockMessage"
import { IMockState } from "./MockState"

export class MockActionFactory extends ActionFactory<MockLeafState,MockMessage> {
  
  constructor() {
    super(MockLeafState)
  }
  
  leaf():string {
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
