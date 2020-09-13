import {ActionMessage} from "../../actions/ActionTypes"
import {MockLeafState} from "./MockLeafState"

export /**
 * Typed action message
 */
interface MockMessage extends ActionMessage<MockLeafState> {

}
