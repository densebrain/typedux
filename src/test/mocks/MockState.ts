import {State} from "../../reducers/State"
import {MockLeafState} from "./MockLeafState"


export interface IMockState extends State<string> {
  type: string
  [key:string]:any
  
  mock: MockLeafState
}

