import type {ObservableStore} from "../store/ObservableStore"
import {ActionAsyncConfig, ActionMessage, ActionStatus, PendingAction} from "./ActionTypes"


import type {InternalActionFactory as InternalActionFactoryType} from "../internal/InternalActionFactory"
import {Bluebird as Promise} from '../util'
import _clone from "lodash/clone"





/**
 * Wraps an action providing tracking events and data
 */
export class ActionTracker<T> implements PendingAction {
  
  
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
  status = ActionStatus.started
  
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
   * @param asyncConfig
   */
  constructor(
    public id:string,
    public leaf:string,
    public actionType: string,
    public name:string,
    public action:(dispatch, getState) => T,
    public store: ObservableStore,
    public asyncConfig: ActionAsyncConfig
  ) {
    
    
    const
      InternalActionFactory: new (store:ObservableStore) => InternalActionFactoryType = require("../internal/InternalActionFactory").InternalActionFactory,
      internalActions = new InternalActionFactory(store)
    
    this._promise = new Promise<T>((resolve, reject) => {
      
      Object.assign(this, {
        reject,
        resolve
      })
      try {
        internalActions.pushPendingAction(this)
        
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
      this.status = ActionStatus.finished
      internalActions.pushPendingAction(_clone(this))
      
      
    })
  }
  
  
}
