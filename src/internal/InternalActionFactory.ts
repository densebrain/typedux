


import { ActionFactory } from "../actions/ActionFactory"
import { InternalState } from "./InternalState"
import { ActionMessage } from "../actions/ActionTypes"
import { INTERNAL_KEY } from "../Constants"
import { ActionReducer } from "../actions/ActionDecorations"
import { IPendingAction, ActionStatus } from "../actions/ActionTracker"


const
	_clone = require('lodash').clone

export class InternalActionFactory extends ActionFactory<InternalState,ActionMessage<InternalState>> {
	
	constructor() {
		super(InternalState)
	}
	
	leaf():string {
		return INTERNAL_KEY
	}
	
	@ActionReducer()
	setPendingAction(action:IPendingAction) {
		return (state:InternalState) => {
			
			let
				newState = new InternalState(state),
				pendingActions = {...newState.pendingActions},
				pendingAction = pendingActions[action.id],
				isFinished = action.status >= ActionStatus.Finished
			
			
			if (!isFinished && !pendingAction) {
				newState.totalActionCount++
				newState.pendingActionCount++
			} else if (isFinished && pendingActions[action.id]) {
				newState.pendingActionCount--
			}
			
			newState.hasPendingActions = newState.pendingActionCount > 0
			
			if (!isFinished) {
				pendingActions[action.id] = _clone(action)
			} else {
				delete pendingActions[action.id]
			}
			
			newState.pendingActions = pendingActions
			
			return newState
		}
	}
	
}