import {State} from "../reducers/State"


export type Selector<S, R> = (state:S) => R

export type InferredSelector<Sel extends (state: any) => any> = Sel extends (state: infer S) => infer R ? Selector<S,R> : never
