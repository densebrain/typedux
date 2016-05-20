import {ActionMessage} from '../actions'

/**
 * Internal reducer type
 */
export type Reducer<S> = (state:S,message:ActionMessage<S>) => S
