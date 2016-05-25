import RootReducer from './RootReducer'

export {
	RootReducer
}

export * from './ReducerTypes'
export * from './RootReducer'
export * from './LeafReducer'
export * from './DefaultLeafReducer'
export * from './State'

//let log = (require('Log') as any).make('Reducers')

// import { combineReducers } from 'redux'

// let allReducers:any = {};
//
// /**
//  * Load all the reducers
//  */
// log.info('Loading reducers now');
// let ctx = require.context(".",true,/(?!.*\b(index)\b).*\.(es6|ts)$/);
// log.info('Found reducers',ctx.keys());
// ctx.keys().forEach((key) => {
// 	log.info('Loading reducers', key);
// 	if (key.indexOf('index') > -1) return;
//
//
//
// 	let reducerModule = ctx(key)
// 	let {path,handle} = reducerModule
// 	allReducers[path] = handle
// });
//
//
// /**
//  * Combine and export
//  */
// export default combineReducers(allReducers);

