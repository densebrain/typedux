import {getLogger} from 'typelogger'
const log = getLogger(__filename)

import RootReducer from "../reducers/RootReducer"


// Vendor
import {
	Store,
	createStore,
	Reducer,
	Unsubscribe,
	Action as ReduxAction,
	StoreEnhancer
} from 'redux'

import {nextTick} from '../util'
import {State,ILeafReducer} from '../reducers'
import StateObserver from './StateObserver'

/**
 * Manage the redux store for RADS
 */
export class ObservableStore<S extends State> implements Store<S> {

	/**
	 * Factory method for creating a new observable store
	 *
	 * @param leafReducers
	 * @param enhancer
	 * @returns {ObservableStore<any>}
	 * @param rootStateType
	 * @param defaultStateValue
	 */
	static createObservableStore<S extends State>(
		leafReducers:ILeafReducer<any,any>[],
		enhancer:StoreEnhancer<any> = null,
		rootStateType:{new():S} = null,
		defaultStateValue:any = null
	):ObservableStore<State> {
		return new ObservableStore(leafReducers,enhancer,rootStateType,defaultStateValue)
	}


	public rootReducer:RootReducer<S>
	private observers:StateObserver[] = []
	private rootReducerFn
	private store
	private pendingTick

	constructor(
		leafReducers:ILeafReducer<any,any>[],
		enhancer:StoreEnhancer<S> = null,
		public rootStateType:{new():S} = null,
		public defaultStateValue:any = null) {

		this.createRootReducer(...leafReducers)
		this.store = createStore(
			this.rootReducerFn,
			this.rootReducer.defaultState(defaultStateValue),
			enhancer
		)

		this.subscribe(() => {
			log.debug('State changed - SCHEDULE NOTIFY')
			this.scheduleNotification()
		})
	}

	/**
	 * Create a new root reducer
	 *
	 * @param leafReducers
	 * @returns {any}
	 */
	private createRootReducer(...leafReducers:ILeafReducer<any,any>[]) {
		this.rootReducer = new RootReducer(this.rootStateType,...leafReducers)
		this.rootReducerFn = this.rootReducer.makeGenericHandler()

		return this.rootReducerFn
	}

	/**
	 * Retrieve the redux store under everything
	 *
	 * @returns {any}
	 */
	getReduxStore() {
		return this.store;
	}



	/**
	 * Update the reducers
	 */
	replaceReducers(...leafReducers:ILeafReducer<any,any>[]):void {
		const rootReducerFn = this.createRootReducer(...leafReducers)
		this.store.replaceReducer(rootReducerFn)
	}

	subscribe(listener:()=>void):Unsubscribe {
		return this.getReduxStore().subscribe(listener);
	}

	replaceReducer(nextReducer:Reducer<S>):void {
		throw new Error("We don't play with no regular reducers ;)")
	}

	/**
	 * Retrieve the current state
	 * @returns {*}
	 */
	getState():S {
		return this.getReduxStore().getState();
	}

	/**
	 * Dispatch typed message
	 *
	 * @param action
	 * @returns {A|undefined|IAction}
	 */
	dispatch<A extends ReduxAction>(action:A):A {
		return this.getReduxStore().dispatch(action)
	}


	/**
	 * Schedule notifications to go out on next tick
	 */
	scheduleNotification() {
		if (this.pendingTick) return;

		this.pendingTick = nextTick(() => {
			let state = this.getState();

			this.pendingTick = null;
			this.observers.forEach((listener) => listener.onChange(state))
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
	observe(path:string|string[], handler) {
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









