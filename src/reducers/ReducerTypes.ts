import {ActionMessage} from '../actions'

/**
 * Internal reducer type
 */
export type Reducer<S,A extends ActionMessage<S>> = (state:S,message:A) => S

