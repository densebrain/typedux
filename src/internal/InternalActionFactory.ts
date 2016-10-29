


import { ActionFactory } from "../actions/ActionFactory"
import { InternalState } from "./InternalState"
import { ActionMessage } from "../actions/ActionTypes"
import { INTERNAL_KEY } from "../Constants"
import { ActionReducer } from "../actions/ActionDecorations"
import { IPendingAction, ActionStatus } from "../actions/ActionTracker"

//noinspection ES6UnusedImports - NOTE: because type is exported
import {Map} from 'immutable'

const
	_clone = require('lodash.clone')

export class InternalActionFactory extends ActionFactory<InternalState,ActionMessage<InternalState>> {
	
	constructor() {
		super(InternalState)
	}
	
	leaf():string {
		return INTERNAL_KEY
	}
	
	@ActionReducer()
	setPendingAction(action:IPendingAction) {
		return (state:InternalState) => state.withMutations((newState:InternalState) => {
			
			let
				{pendingActions} = newState,
				isFinished = action.status >= ActionStatus.Finished
			
			
			if (!isFinished && !pendingActions.has(action.id)) {
				newState.set('totalActionCount', newState.totalActionCount + 1)
				newState.set('pendingActionCount', newState.pendingActionCount + 1)
			} else if (isFinished && pendingActions.has(action.id)) {
				newState.set('pendingActionCount',newState.pendingActionCount - 1)
			}
			
			newState.set('hasPendingActions',newState.pendingActionCount > 0)
			
			pendingActions = !isFinished ?
				pendingActions.set(action.id,_clone(action)) :
				pendingActions.remove(action.id)
			
			newState.set('pendingActions',pendingActions)
			
			return newState
		}) as InternalState
	}
	
}