import DumbReducer from "../reducers/DumbReducer"

require("source-map-support").install()

import {isFunction, isString, propertyChain} from "../util"
import {getValue} from 'typeguard'

import {installMockStoreProvider, createMockStore} from './mocks/TestHelpers'
import {RootReducer, ILeafReducer, State, Reducer} from '../reducers'
import {ActionMessage, ActionFactory, ActionReducer} from '../actions'

import {getLogger} from 'typelogger'

import {ActionThunk, Promised} from "../actions/ActionDecorations"

import Promise from "../util/PromiseConfig"
import {ObservableStore} from "../store/ObservableStore"
import {getStoreInternalState} from "../actions/Actions"
import {selectorChain} from "../selectors/SelectorChain"
import {Selector} from "../selectors/SelectorTypes"

const
  log = getLogger(__filename)

// installMockStoreProvider()
//
// function getDefaultState(reducer) {
// 	return reducer.handle(null,{type:'@INIT'})
// }
//
// const
// 	MockKey = 'mock',
// 	MockStateStr1 = 'my first string'
//
//
// /**
//  * Mock leaf state, dumb test state with test props
//  */
// class MockLeafState implements State<any> {
// 	type = MockLeafState
//
// 	str1:string = MockStateStr1
// 	str2:string
//
// 	constructor(props:any = {}) {
//
//
// 		Object.assign(this,props)
// 	}
// }
//
// /**
//  * Make root reducer
//  *
//  * @param {ILeafReducer<any, any>} leafReducers
//  * @returns {RootReducer<State<any>>}
//  */
// function makeRootReducer(...leafReducersOrStates:Array<ILeafReducer<any,any>|State<string>>) {
// 	let
// 		leafReducers = leafReducersOrStates.filter(it => isFunction(getValue(() => (it as any).leaf))) as Array<ILeafReducer<any,any>>,
// 		leafStates = leafReducersOrStates.filter(it => !isFunction(getValue(() => (it as any).leaf)) && isString(getValue(() => (it as any).type))) as Array<State<string>>
//
// 	leafReducers = [...leafReducers, ...leafStates.map(state => new DumbReducer(state))]
//
// 	return new RootReducer(null,...leafReducers)
// }
//
// interface IMockState extends State<string> {
// 	type: string
// 	[key:string]:any
// }
//
// /**
//  * Typed action message
//  */
// interface MockMessage extends ActionMessage<MockLeafState> {
//
// }
//
// //
// // class MockLeafReducer implements ILeafReducer<MockLeafState,MockMessage> {
// //
// // 	leaf():string {
// // 		return MockKey;
// // 	}
// //
// // 	prepareState(o:any) {
// // 		return o
// // 	}
// //
// //
// // 	defaultState() {
// // 		return new MockLeafState()
// // 	}
// // }
//
// // Simple mock factory
// class MockActionFactory extends ActionFactory<MockLeafState,MockMessage> {
//
// 	constructor() {
// 		super(MockLeafState)
// 	}
//
// 	leaf():string {
// 		return MockKey;
// 	}
//
//
//
// 	@ActionReducer()
// 	mockUpdate(val:string) {
// 		return (state:IMockState) => ({...state, str1: val})
// 	}
//
// 	@ActionReducer()
// 	mockUpdateFromState(newVal:string) {
// 		return (state:Map<string,any>) => ({...state, str2: newVal})
// 	}
//
// 	@ActionThunk()
// 	mockThunk() {
// 		return Promised((dispatch,getState) => {
// 			return Promise.delay(1000).then(() => "mock")
// 		})
// 	}
//
// 	@ActionThunk()
// 	mockThunkError() {
// 		return Promised((dispatch,getState) => {
// 			return Promise.delay(1000).then(() => {
// 				throw new Error('MockThunkErrorTest')
// 			})
// 		})
// 	}
// }


describe('#selectors', function () {
  this.timeout(10000)
  
  
  it('Selector results in simple selector', () => {
    const
      o = {
        type: "dummyState",
        a: {
          b: {
            c: "hello",
            d: [1, 2, 3]
          }
        }
      },
      selectorChainTests:Array<[Selector<any, any>, any, Array<string | number>]> = [
        [
          selectorChain(o).a.b.c(),
          o.a.b.c,
          ["a", "b", "c"]
        ]
      ],
      propChainTests = [
        [
          propertyChain(o).a.b.c((getter, keyPath) => [getter(o), keyPath]),
          o.a.b.c,
          ["a", "b", "c"]
        ],
        [
          propertyChain(o).a.b.d((getter, keyPath) => [getter(o), keyPath]),
          o.a.b.d,
          ["a", "b", "d"]
        ],
        [
          propertyChain(o).a.b.d[0]((getter, keyPath) => [getter(o), keyPath]),
          o.a.b.d[0],
          ["a", "b", "d", 0]
        ]
      ] as any
    
    const selector = selectorChain(o).a.b.c()
    
    for (const [[value, keyPath], testValue, testKeyPath] of propChainTests) {
      //const [value, keyPath] = chain()
      
      log.info("Key path", keyPath, "value", value)
      expect(value).to.equal(testValue)
      expect(keyPath).to.deep.equal(testKeyPath)
    }
    
    for (const [selector, testValue, testKeyPath] of selectorChainTests) {
      //const [value, keyPath] = chain()
      const value = selector(o)
      //log.info("Key path", keyPath, "value", value)
      expect(value).to.equal(testValue)
      //expect(keyPath).to.deep.equal(testKeyPath)
    }
    
    
    // Make sure the children changed too
    // let mockStateAfter = actions.state
    // expect(mockState).not.to.equal(mockStateAfter)
    // expect(mockStr1Update).to.equal(mockStateAfter.str1)
  })
  
  
})
