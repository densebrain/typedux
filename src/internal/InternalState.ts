import type { PendingAction } from "../actions"
import type { State } from "../reducers"
import { INTERNAL_KEY } from "../constants"

export type InternalStateKey = typeof INTERNAL_KEY

export class InternalState implements State<InternalStateKey> {
  static Key: InternalStateKey = INTERNAL_KEY

  /**
   * Deserialize
   *
   * @param o
   * @returns {InternalState&U&{pendingActions: (Map<any, any>|Map<string, any>|any)}}
   */
  static fromJS(o: any = {}) {
    if (o instanceof InternalState) return o

    const state = new InternalState(),
      { pendingActions = [] } = o

    return Object.assign(state, { pendingActions })
  }

  /**
   * Create a new internal state
   */
  constructor(o: any = {}) {
    Object.assign(this, o)
  }

  type: InternalStateKey = INTERNAL_KEY

  /**
   * All pending actions
   */
  pendingActions: PendingAction[] = []
	
	/**
	 * Total actions executed
	 */
	totalActionCount: number = 0
	
	/**
	 * Pending action count
	 */
  pendingActionCount: number = 0
	
	
	/**
	 * Has pending actions currently ?
	 */
  hasPendingActions: boolean = false

  /**
   * Returns empty object - can not be serialized
   */
  toJS() {
    return this
  }
}
