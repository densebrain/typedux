import type {ObservableStore} from "../store/ObservableStore"
import type {ActionMessage} from "./ActionTypes"


import {InternalActionFactory} from "../internal"
import {Bluebird as Promise} from '../util'


/**
 * Get an instance of the internal action factory
 *
 * @returns {InternalActionFactory}
 * @param store
 */
function getInternalActions(store: ObservableStore<any>): InternalActionFactory {
  return new InternalActionFactory(store)
}


export enum ActionStatus {
  Started = 1,
  Finished = 2
}


export interface PendingAction {
  id:string
  leaf:string
  name:string
  status:ActionStatus
  
}

/**
 * Wraps an action providing tracking events and data
 */
export class ActionTracker<T> {
  
  
  /**
   * Resolve the underlying promise
   */
  private resolve:Function
  
  /**
   * Reject the underlying promise
   */
  private reject:Function
  
  /**
   * Action Status
   *
   * @type {ActionStatus}
   */
  status = ActionStatus.Started
  
  /**
   * Action promise
   */
  private _promise:Promise<T>
  
  
  /**
   * Get the underlying promise
   *
   * @returns {Promise<T>}
   */
  get promise() {
    return this._promise
  }
  
  /**
   * Create new action tracker
   *
   * @param leaf
   * @param name
   * @param action
   * @param id
   * @param store
   */
  constructor(
    public id:string,
    public leaf:string,
    public name:string,
    public action:(dispatch, getState) => T,
    public store: ObservableStore<any>
  ) {
    
    
    const
      internalActions = getInternalActions(store)
    
    this._promise = new Promise<T>((resolve, reject) => {
      
      Object.assign(this, {
        reject,
        resolve
      })
      try {
        internalActions.setPendingAction(this)
        
        const
          dispatch = <A extends ActionMessage<any>>(action: A): A =>
            store?.dispatch(action),
          getState = () => store?.getState(),
          result =
            action(dispatch, getState)
        
        // UNWRAP PROMISE
        Promise
          .resolve(result)
          .then(resolve)
          .catch(reject)
        
      } catch (err) {
        reject(err)
      }
    }).finally(() => {
      // FINALLY NOTIFY INTERNAL STATE
      this.status = ActionStatus.Finished
      internalActions.setPendingAction({...this})
      
      
    })
  }
  
  
}
