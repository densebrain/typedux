import {isFunction} from '../util'
import type {
  ActionFactory,
  ActionFactoryConstructor,
  ActionMessage,
  ActionOptions,
  ActionRegistration
} from './ActionTypes'
import type {StateKey} from '../reducers'


import {getLogger} from '@3fv/logger-proxy'
import {ActionTracker} from "./ActionTracker"
import {createActionRegistration} from "./Actions"

const
  log = getLogger(__filename)



/**
 * Decorate an action with options provided
 *
 * @param options
 */
function actionDecorator<A extends ActionFactory = ActionFactory, F extends ActionFactoryConstructor<A> = ActionFactoryConstructor<A>>(options:ActionOptions<F> = {}) {
  
  // Actual decorator is returned
  return function <S extends A["state"] = A["state"], M extends ActionMessage<S> = ActionMessage<S>>(
    target: A,
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
    
    
    let reg:ActionRegistration = null
    
    // Override the default method
    descriptor.value = function (...preArgs:any[]) {
      const actionFactory = target as ActionFactory<any, any>,
        store = actionFactory?.getStore(),
        actionContainer = store?.actionContainer
      return actionContainer?.executeActionChain(reg, (id, ...args) => {
        
        // Grab the current dispatcher
        const {dispatcher} = actionFactory
        
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
            store
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
  
    descriptor.value.bind(target)
    
    /**
     * If this is a reducer function, then
     * register the actual action
     */
    const actionFn = (options.isReducer) ? actionCreator : descriptor.value
    //getStore()?.actions?.
    reg = target.registerAction(
      createActionRegistration<A, F, StateKey<S>>(
      target.constructor as F,
      target.leaf(),
      propertyKey,
      actionFn,
      options
      )
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

