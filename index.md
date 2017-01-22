# TypeDux / Redux / ReTyped

A leaf based TypeScript 2 Immutable wrapper around REDUX - all decoration driven

To start, like everyone else, I love the benefits of an immutable functional paradigm, but the overhead of
implementing it in the real world consistently proves difficult for a number of reasons
* Learning curve
* Type Safety
* Re-usability
* Scope access
* Integration into a current application

The issues arise from a completely decoupled solution, which in practice provides an optimal usage pattern,
but provides hurdle after hurdle in terms of learning and on-boarding as well as reusing existing code.

Enter _TypeDux_, simply put it's redux with an immutable & observable root state that is statically typed at every node
 and end, reuse and manage

## Install

Same as every other package, note that reflect-metadata, ImmutableJS and Redux are peer dependencies

```
NOTE: Runtime requires ES6 level polyfills - so babel-polyfill or transform-runtime, etc work just fine

npm i --save typdux
```

## Getting Started

1.  Create a leaf state and message (message is optional, only for typescript and can be any)
```javascript
//Typescript

import * as Immutable from 'immutable'

/**
 * Leaf record defines allowed props
 */
const ExampleLeafRecord = Immutable.Record({
	str1: 'str1',
	str2: null
})

/**
 * Mock leaf state, dumb test state with test props
 */
class ExampleLeafState extends ExampleLeafRecord {
	str1:string
	str2:string

	constructor(props:any = {}) {
		super(props)

		Object.assign(this,props)
	}
}

/**
 * Typed action message (optional)
 */
interface ExampleMessage extends ActionMessage<ExampleLeafState> {

}

```
2.  Create an `ActionFactory`
```javascript
//Typescript
import {ActionFactory,ActionReducer,ActionThunk} from 'typedux'

class ExampleActionFactory extends ActionFactory<ExampleLeafState,ExampleLeafMessage> {

	constructor() {
  		super(ExampleLeafState)
  	}

  	leaf():string {
  		return 'exampleLeafKey';
  	}

  	/**
    * State Accessors are SUPER easy
		  */
    getStr1() {
			return this.state.str1
    }

    /**
    * Reducers (if you don't know what a reducer is checkout the redux docs)
    * are super easy, annotate ActionReducer and return a function that takes state  
		 */
  	@ActionReducer()
  	exampleStr1Update(val:string) {
  		return (state:ExampleLeafState) => state.set('str1',val)
  	}

  	/**
  	* Thunks are now track-able and wrapped in promises,  
  	* getState is superfluous as it dispatch because this.state and
  	* calling any action directly provides required context
		 */
  	@ActionThunk()
    exampleThunk() {
      return Promised((dispatch,getState) => {
        return Promise.delay(1000).then(() => "example")
      })
    }
}
```

3.  Create the store

__NOTE: ALL ACTION FACTORIES AND DECORATIONS MUST BE LOADED BEFORE CREATING THE STORE__

```javascript
// Typescript
const store = ObservableStore.createObservableStore(

	// Array of reducers (can be an empty array if only using @ActionFactory)
	reducers,

	// Additional enhancers for dev, etc
	compose.call(null, ...enhancers) as StoreEnhancer<any>,

	// Initial state
	null
)
```

4.  Observe store keys and leafs
```javascript

// Create an observer
const unsub = store.observe(['exampleLeafKey','str1'],(newStr1,oldStr1) => {
	console.log(`str1 change from`,oldStr1,`to`,newStr1)
})

// Unsubscribe when done
unsub()
```

## CREDIT

Jonathan Glanz @jglanz
