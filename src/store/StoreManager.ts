import RootReducer from "../reducers/RootReducer";
const log = getLogger(__filename)

// Vendor
import { Store,createStore,Reducer,compose,Unsubscribe, Action,
	applyMiddleware,Middleware, StoreEnhancer } from 'redux'
import {ActionMessage} from '../actions'
import {State,ILeafReducer} from '../reducers'

// RADS
import {VariableProxy,nextTick} from '../util'
import StateObserver from './StateObserver'


/**
 * Manage the redux store for RADS
 */
class ObservableStore<S extends State> implements Store<S> {

	private createRootReducer(...leafReducers:ILeafReducer<any,any>[]) {
		this.rootReducer = new RootReducer(...leafReducers)
		return <A extends ActionMessage<any>>(state:S,action:A):S => {
			
			return ((this.rootReducer) ?
				this.rootReducer.handle(state,action) :
				null) as S
		}
	}

	/**
	 * Factory method for creating a new observable store
	 * 
	 * @param leafReducers
	 * @param initialState
	 * @param enhancer
	 * @returns {ObservableStore<S>}
	 */
	static createObservableStore<S extends State>(leafReducers:ILeafReducer<any,any>[],initialState:S = ({} as any),enhancer:StoreEnhancer<S> = null):ObservableStore<S> {
		
		return new ObservableStore(leafReducers,initialState,enhancer)
	}

	private observers:StateObserver[] = []
	private rootReducer:RootReducer
	private rootReducerFn
	private store:Store<S>
	
	constructor(leafReducers:ILeafReducer<any,any>[],initialState:S = ({} as any),enhancer:StoreEnhancer<S> = null) {
		
		this.rootReducerFn = this.createRootReducer(...leafReducers)
		this.store = createStore(this.rootReducerFn,initialState,enhancer)
	}

	/**
	 * Retrieve the redux store under everything
	 *
	 * @returns {any}
	 */
	getInternalStore() {
		return this.store;
	}

	

	/**
	 * Update the reducers
	 */
	replaceReducers(...leafReducers:ILeafReducer<any,any>[]):void {
		this.rootReducerFn = this.createRootReducer(...leafReducers)
		this.store.replaceReducer(this.rootReducerFn)
	}

	/**
	 * Enable hot replace
	 */
	enableHot() {
		// if (module.hot) {
		// 	// Enable Webpack hot module replacement for reducers
		// 	module.hot.accept('core/reducers/RootReducer', () => {
		// 		this.replaceReducers()
		// 	})
		// }
	}


	subscribe(listener:()=>void):Unsubscribe {
		return this.getInternalStore().subscribe(listener);
	}

	replaceReducer(nextReducer:Reducer<S>):void {
		throw new Error('We dont play with no regular reducers ;)')
	}

	/**
	 * Retrieve the current state
	 * @returns {*}
	 */
	getState():S {
		return this.getInternalStore().getState();
	}

	dispatch<A extends Action>(action:A):A {
		return this.getInternalStore().dispatch(action)
	}

	scheduleNotification() {
		// if (this.pendingTick) return;

		let state = this.getState();
		log.info('Store updated',state);

		// this.pendingTick = null;
		this.observers.forEach((listener) => {
			log.info('notifying', listener)

			listener.onChange(state)
		})

	}

	/**
	 *
	 */
	onChange() {
		this.scheduleNotification();
	}


	/**
	 * Observe state path for changes
	 *
	 * @param path
	 * @param handler
	 * @returns {function()} unsubscribe observer
	 */
	observe(path:string, handler) {
		let observer = new StateObserver(path,handler)
		this.observers.push(observer)

		const removeObserver:any = () => {
			if (observer.removed) {
				log.debug("Already removed this observer", observer);
				return;
			}

			this.observers.find((it,index) => {
				if (observer === it) {
					this.observers.splice(index,1)
					return true
				}
				
				return false
			})
			
			observer.removed = true
		}

		removeObserver.observer = observer
		return removeObserver


	}


}









