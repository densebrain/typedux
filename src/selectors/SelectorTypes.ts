import {State} from "../reducers/State"


export type Selector<S, R> = (state:S) => R
