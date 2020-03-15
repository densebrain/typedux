import {getLogger} from 'typelogger'
import {InternalActionFactory} from "../internal/InternalActionFactory"

import Promise from '../util/PromiseConfig'
import {isPromise} from "../util/index"

const
  log = getLogger(__filename)

let
  InternalActionFactoryClazz:typeof InternalActionFactory

/**
 * Get an instance of the internal action factory
 *
 * @param dispatch
 * @param getState
 * @returns {InternalActionFactory}
 */
function getInternalActions(dispatch, getState) {
  if (!InternalActionFactoryClazz)
    InternalActionFactoryClazz = require("../internal/InternalActionFactory").InternalActionFactory
  
  return InternalActionFactoryClazz
    .newWithDispatcher(InternalActionFactoryClazz, dispatch, getState)
}


export enum ActionStatus {
  Started = 1,
  Finished = 2
}


export interface IPendingAction {
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
   * @param dispatch
   * @param getState
   * @param id
   */
  constructor(
    public id:string,
    public leaf:string,
    public name:string,
    public action:(dispatch, getState) => T,
    public dispatch:Function,
    public getState:Function
  ) {
    
    
    const
      internalActions = getInternalActions(dispatch, getState)
    
    this._promise = new Promise<T>((resolve, reject) => {
      
      Object.assign(this, {
        reject,
        resolve
      })
      try {
        internalActions.setPendingAction(this)
        
        const
          result =
            action(dispatch, getState)
        
        // WRAP PROMISE
        if (isPromise(result)) {
          result
            .then(resolve)
            .catch(reject)
        }
        
        // WRAP REGULAR ACTION
        else {
          resolve(result)
        }
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