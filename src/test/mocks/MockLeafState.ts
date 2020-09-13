import {State} from "../../reducers/State"
import {MockStateStr1} from "./MockConstants"

/**
 * Mock leaf state, dumb test state with test props
 */
export class MockLeafState implements State<any> {
  static Key = "mock"
  
  type = MockLeafState.Key
  // type = MockLeafState
  //
  str1:string = MockStateStr1
  str2:string
  
  constructor(props:any = {}) {
    
    
    Object.assign(this,props)
  }
}
