import type {ObservableStore} from "../store"

import { PendingAction, ActionStatus, ActionMessage } from "../actions/ActionTypes"
import {BaseActionFactory} from "../actions/BaseActionFactory"
import {ActionReducer} from "../actions/decorators"
import { InternalState, InternalStateKey } from "./InternalState"
import { INTERNAL_KEY } from "../constants"
import _clone from "lodash/clone"


export class InternalActionFactory extends BaseActionFactory<InternalState,ActionMessage<InternalState>, InternalStateKey> {
	
	constructor(store?: ObservableStore) {
		super(InternalState,store)
	}
	
	leaf():InternalStateKey {
		return INTERNAL_KEY
	}
	
	@ActionReducer()
	pushPendingAction(action:PendingAction) {
		return (state:InternalState) => {
			
			let
				newState = new InternalState(state),
				pendingActions = [...newState.pendingActions],
				pendingAction = pendingActions.find(({id}) => id === action.id),
				isFinished = action.status !== ActionStatus.started
			
			
			if (!isFinished && !pendingAction) {
				newState.totalActionCount++
			}
			
			
			
			const index = pendingActions.findIndex(({id}) => id === action.id)
			if (!isFinished) {
				if (index === -1) {
					pendingActions.push(_clone(action))
				}else {
					pendingActions[index] = _clone(action)
				}
			} else {
				delete pendingActions[index]
			}
			
			newState.pendingActionCount = pendingActions.length
			newState.hasPendingActions = newState.pendingActionCount > 0
			newState.pendingActions = pendingActions
			
			return newState
		}
	}
	
}
