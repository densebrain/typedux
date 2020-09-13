import {ObserverDisposer} from "../store/ObservableStore"

export type SelectorSubscriptionListener<R> = (value: R, previousValue?: R) => any

export type SelectorFn<S, R> = ((state:S) => R)

export type Selector<S, R> = SelectorFn<S, R> & {
  subscribe(listener: SelectorSubscriptionListener<R>):ObserverDisposer
}

export type InferredSelector<Sel extends (state: any) => any> = Sel extends (state: infer S) => infer R ? Selector<S,R> : never

