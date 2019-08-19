
import {State} from "../reducers/State"
import {
  PropChainType,
  continuePropertyChain,
  PropChainCallback,
  PropChainDataAccessor,
  PropChainDataWrapper
} from "../util/PropertyChain"
import { Selector } from "./SelectorTypes";

// export type SelectorChainType<S,T> = Exclude<PropChainType<S, T>, PropChainDataAccessor<S,T>> & {
//   (): Selector<S,T>
// }


export type SelectorChainDataAccessor<S,T> = () => Selector<S,T>
// {
//   (): Selector<S extends State<any> ? S : never,T>
// }
export interface SelectorChainCallback<S,T> {
  (getter: (state: S) => T, keyPath: Array<string | number>):
    SelectorChainDataAccessor<S,T>
    //() => Selector<S extends State<any> ? S : never,T>
}

//export type SelectorChainType<S,T> = PropChainDataWrapper<S, NonNullable<T>> & SelectorChainDataAccessor<S,T>
function continueSelectorChain<
  S,
  T
>(
  state:S,
  data:T,
  keyPath:Array<string | number> = []
): PropChainType<S,T,SelectorChainDataAccessor<S,T>> {//SelectorChainType<S,T> {
  keyPath = keyPath || []
  return continuePropertyChain<S,T,SelectorChainCallback<S,T>, SelectorChainDataAccessor<S,T>>(
    state,data, keyPath,
    (getter: (state: S) => T, keyPath: Array<string | number>) =>
      () => (state: S) => getter(state)
    
  )
  
  // return (new Proxy(
  //   continuePropertyChain<S,T,any>(state,data, keyPath, continueSelectorChain),
  //   {
  //     apply(target, thiz, args) {
  //       return target((getter, keyPath) => {
  //
  //         return (state: S) => getter(state)
  //       })
  //     }
  //     // <Callback extends PropChainCallback<S, T>>(callback:Callback) => {
  //     //
  //     //   // TRACK FIRST PROP ACCESS
  //     //   const firstGet = [...keyPath.map(() => true)]
  //     //
  //     //   // CHECK IF KEY SHOULD BE NUMBER
  //     //   function resolveKey(value, key, index) {
  //     //     if (firstGet[index]) {
  //     //       if (Array.isArray(value)) {
  //     //         const keyNum = _.toNumber(key)
  //     //         if (isNumber(keyNum)) {
  //     //           key = keyPath[index] = keyNum
  //     //         }
  //     //       }
  //     //       firstGet[index] = false
  //     //     }
  //     //
  //     //     return key
  //     //   }
  //     //
  //     //   const getter = (state:S) =>
  //     //     keyPath.reduce((value, key, index) => {
  //     //       return value[resolveKey(value, key, index)]
  //     //     }, state)
  //     //
  //     //   return callback(getter, keyPath)
  //     // },
  //     // {
  //     //   get: (target, key) => {
  //     //     return (continueSelectorChain(state, undefined, [...keyPath, key as any]))
  //     //   }
  //     // }
  //   })) as SelectorChainType<S, T>
}

export type SelectorChain<S> = PropChainType<S, S,SelectorChainDataAccessor<S,S>>

export function selectorChain<
  S
>(
  state:S
): SelectorChain<S> {
  return continueSelectorChain(state, state)
}
