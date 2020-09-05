
import "source-map-support/register"
import "jest"
import {chain} from "lodash"
import {getLogger} from '@3fv/logger-proxy'
import {propertyChain} from "../util/PropertyChain"
import {selectorChain} from "../selectors/SelectorChain"
import {Selector} from "../selectors/SelectorTypes"
import {createBuilder} from "../Builder"
import {createDefaultRootState} from "../reducers/State"





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