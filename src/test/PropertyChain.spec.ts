import "source-map-support/register"
import "jest"
import {getLogger} from '@3fv/logger-proxy'
import {propertyChain} from "../util/PropertyChain"
import {selectorChain} from "../selectors/SelectorChain"
import {Selector} from "../selectors/SelectorTypes"
import {ILeafReducer, RootReducer} from "../reducers/index"
import {ObservableStore} from "../store/ObservableStore"
import {getDefaultMockState, MockKey, MockStateStr1} from "./mocks/MockConstants"
import {createMockRootReducer} from "./mocks/createMockRootReducer"

import { IMockState } from "./mocks/MockState"
import {MockLeafState} from "./mocks/MockLeafState"
import {setGlobalStore} from "../actions/Actions"
import {MockActionFactory} from "./mocks/MockActionFactory"


require("source-map-support").install()

//installMockStoreProvider()

const
  log = getLogger(__filename)

describe('#selectors', function () {
  //jest.setTimeout(10000)
  jest.setTimeout(10000)
  
  let
    reducer:RootReducer<any>,
    leafReducers:Array<ILeafReducer<IMockState,any>>,
    leafReducer:ILeafReducer<any,any>,
    store = null,
    actions
  
  beforeEach(() => {
    // leafReducers = ObservableStore.makeSimpleReducers({type: MockKey, str1: MockStateStr1})//new MockLeafReducer()
    
    // ROOT REDUCER
    reducer = createMockRootReducer(ObservableStore.makeInternalReducer(),leafReducer)
    
    // STORE
    store = ObservableStore.createObservableStore(
      ObservableStore.makeSimpleReducers(new MockLeafState()),
      undefined,
      undefined,
      //getDefaultMockState(reducer),
      {
        mock: new MockLeafState()
      }
    )
    setGlobalStore(store)
    // INIT
    //store.dispatch({type:'@INIT'})
    
    // ACTIONS
    actions = new MockActionFactory().setStore(store)
  })
  
  it('Selector subscribe', () => {
    
    let count = 0
    selectorChain(store as any, null as IMockState)
      .mock
      .str1()
      .subscribe((newValue, oldValue) => {
        //console.log("new", newValue, "old", oldValue)
        if (!count) {
          expect(newValue).toBe(MockStateStr1)
        }else {
          expect(newValue).toBe("cool")
          expect(oldValue).toBe(MockStateStr1)
        }
        count++
      })
  
    actions.mockUpdate(MockStateStr1)
    actions.mockUpdate("cool")
  })
  
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
      //store = configureMockStore()(o),
      selectorChainTests:Array<[Selector<typeof o, any>, any, Array<string | number>]> = [
        [
          selectorChain(store as any,o).a.b.c(),
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
    
    //const selector = selectorChain(o).a.b.c()
    
    for (const [[value, keyPath], testValue, testKeyPath] of propChainTests) {
      //const [value, keyPath] = chain()
      
      log.info("Key path", keyPath, "value", value)
      expect(value).toBe(testValue)
      expect(keyPath).toMatchObject(testKeyPath)
    }
    
    for (const [selector, testValue] of selectorChainTests) {
      //const [value, keyPath] = chain()
      const value = selector(o)
      //log.info("Key path", keyPath, "value", value)
      expect(value).toBe(testValue)
      //expect(keyPath).to.deep.equal(testKeyPath)
    }
    
    
    // Make sure the children changed too
    // let mockStateAfter = actions.state
    // expect(mockState).not.to.equal(mockStateAfter)
    // expect(mockStr1Update).to.equal(mockStateAfter.str1)
  })
  
  
})
