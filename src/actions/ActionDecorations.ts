import {isFunction} from '../util'
import {ActionMessage} from './ActionTypes'
import {Reducer, State} from '../reducers'
import {ActionFactory} from './ActionFactory'
import {executeActionChain, registerAction, getStoreStateProvider, IActionRegistration} from './Actions'

import {getLogger} from '@3fv/logger-proxy'
import {ActionTracker} from "./ActionTracker"

const
  log = getLogger(__filename)


export type ActionOptions = {
  isPromise?:boolean
  isReducer?:boolean
  factory?:any
  reducers?:Reducer<any, any>[]
  mapped?:string[]
}


/**
 * Action factory provider
 */
export type ActionFnProvider<T> = (...args:any[]) => (dispatch, getState) => T

/**
 * Action reducer provider
 */
export type ActionReducerProvider<S> = (...args:any[]) => (state:S) => S


/**
 * Action provider
 */
export type TActionProvider<T, S> = ActionFnProvider<T> | ActionReducerProvider<S>

/**
 * Wrap action function so compiler allows it
 *
 * @param fn
 * @constructor
 */
export function Promised<T,Args extends any[]>(fn:(...args:Args) => T | Promise<T>):Promise<T> {
  return ((...args:Args) => {
    return fn(...args)
  }) as any
}

/**
 * Decorate an action with options provided
 *
 * @param options
 */
function actionDecorator(options:ActionOptions = {}) {
  
  // Actual decorator is returned
  return function <S extends State<any>, M extends ActionMessage<S>>(
    target:ActionFactory<S, M>,
    propertyKey:string,
    descriptor:TypedPropertyDescriptor<any>
  ) {
    const
      actionCreator = descriptor.value,
      {mapped: argNames, reducers} = options,
      
      
      // Build arg mapping function
      mapArgs = (!argNames || argNames.length === 0) ? null : (args) => {
        const data:any = {}
        if (!argNames || argNames.length !== args.length) {
          const msg = `Action descriptor for ${propertyKey}, received no method or argNames length did not match arg length - args = ${(args.join(', '))}
							- argNames = ${(argNames || []).join(', ')}`
          log.error(msg, args, argNames, propertyKey, descriptor)
          throw new Error(msg)
        }
        
        argNames.forEach((argName, index) => {
          data[argName] = args[index]
        })
        
        return data
      }
    
    
    let reg:IActionRegistration = null
    
    // Override the default method
    descriptor.value = function (...preArgs:any[]) {
      return executeActionChain(reg, (id, ...args) => {
        
        // Grab the current dispatcher
        const
          {dispatcher} = this
        
        let
          data:any = (actionCreator && !options.isReducer) ?
            actionCreator.apply(this, args) :
            {}
        
        
        // If PROMISE/THUNK function then call it and return it
        if (isFunction(data) && !options.isReducer) {
          return new ActionTracker(
            id,
            this.leaf(),
            propertyKey,
            data,
            dispatcher,
            getStoreStateProvider()
          ).promise
        }
        
        
        // If data not returned or this is Mapped - then
        // loop mapped args
        if (argNames) {
          data = mapArgs(args)
        }
        
        // If no reducers are passed in the map directly to state
        let finalReducers = (reducers) ? [...reducers] : []
        
        // Create the action message -> Dispatch
        const message = this.newMessage(
          id,
          this.leaf(),
          propertyKey,
          finalReducers,
          args,
          data
        )
        
        // Dispatch the message
        dispatcher(message)
        
        return message
      }, ...preArgs)
    }
    
    /**
     * If this is a reducer function, then
     * register the actual action
     */
    const actionFn = (options.isReducer) ? actionCreator : descriptor.value
    
    reg = registerAction(
      target.constructor,
      target.leaf ? target.leaf() : '__typedux',
      propertyKey,
      actionFn,
      options
    )
    
    return descriptor
    
  }
}

/**
 * An action that returns a reducer function
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionReducer(options:ActionOptions = {}) {
  return actionDecorator(Object.assign({}, options, {isReducer: true}))
}


/**
 * Action that returns a promise factory function
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionPromise(options:ActionOptions = {}) {
  return actionDecorator(Object.assign({}, options, {isPromise: true}))
}

/**
 * Method decorator for actions
 *
 * @param options
 * @returns {(target:ActionFactory<S, M>, propertyKey:string, descriptor:TypedPropertyDescriptor<any>)=>TypedPropertyDescriptor<any>}
 * @constructor
 */
export function ActionThunk(options:ActionOptions = {}) {
  return actionDecorator(options)
}

