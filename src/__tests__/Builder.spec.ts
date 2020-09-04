
import "source-map-support/register"
import "jest"
import {chain} from "lodash"
import {getLogger} from '@3fv/logger-proxy'
import {propertyChain} from "../src/util/PropertyChain"
import {selectorChain} from "../src/selectors/SelectorChain"
import {Selector} from "../src/selectors/SelectorTypes"
import {createBuilder} from "../src/Builder"
import {createDefaultRootState} from "../src/reducers/State"





const
  log = getLogger(__filename)

describe('#builder', function () {
  //jest.setTimeout(10000)
  
  
  it('Builder type check', () => {
    const rootState = {
      ...createDefaultRootState(),
      "dummy": {
        type: "dummy",
        a: {
          b: {
            c: "hello",
            d: [1, 2, 3]
          }
        }
      }
    }
    
    const
      //testFn = jest.fn(),
      fromActions = {
      hello: (state: typeof rootState, actions: typeof fromActions, toName: string ) => {
        return `hello ${toName}`
      }
    }
    
    
    chain(createBuilder<typeof rootState>())
      .thru(builder =>
        builder.withActions("test", fromActions).actionNS.test.hello({} as typeof rootState, fromActions, "jon")
      )
      .tap(({actionsNs}) => {
        
        expect(
          actionsNs.actions.test.hello({} as typeof rootState, actionsNs, "jon")
        )
          .toBe(`hello jon`)
      })
    
  })
})