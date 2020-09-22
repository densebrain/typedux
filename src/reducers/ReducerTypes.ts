import type {ActionMessage} from '../actions'
import { State } from './State'

/**
 * Internal reducer type
 */
export type Reducer<S extends State, A extends ActionMessage<S>> = (state:S,message:A) => S

