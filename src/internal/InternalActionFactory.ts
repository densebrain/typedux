import type {ObservableStore} from "../store"

import { PendingAction, ActionStatus, ActionMessage } from "../actions/ActionTypes"
import {ActionFactory} from "../actions/ActionFactory"
import {ActionReducer} from "../actions/ActionDecorations"
import { InternalState } from "./InternalState"

import { INTERNAL_KEY } from "../Constants"


import _clone from "lodash/clone"


export class InternalActionFactory extends ActionFactory<InternalState,ActionMessage<InternalState>> {
	
	constructor(store?: ObservableStore<any>) {
		super(InternalState,store)
	}
	
	leaf():string {
		return INTERNAL_KEY
	}
	
	@ActionReducer()
	setPendingAction(action:PendingAction) {
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
