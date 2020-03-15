import "jest"
import {getLogger} from 'typelogger'
import {propertyChain} from "../util/PropertyChain"
import {selectorChain} from "../selectors/SelectorChain"
import {Selector} from "../selectors/SelectorTypes"


require("source-map-support").install()

const
  log = getLogger(__filename)

describe('#selectors', function () {
  //jest.setTimeout(10000)
  
  
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
      selectorChainTests:Array<[Selector<typeof o, any>, any, Array<string | number>]> = [
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
