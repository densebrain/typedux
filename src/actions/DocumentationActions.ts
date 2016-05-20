//
// import * as _ from 'lodash'
// import { Document, DocumentationState, ConfluenceDocument,
// 	DocumentationActionMessage,DocumentationKey } from '../models/DocumentationModel'
//
// import {ActionFactory, ActionDescriptor} from "./Actions";
//
// import {ResourceStatus} from "../models/CommonModel";
//
// const log = require<any>('log/make')('ConfluenceActions')
// //import httpClient = HttpClient
// //import * as HttpClient from '../../HttpClient'
// // const HttpClient:any = require('HttpClient')
// const ContentPath = 'content';
// const SearchPath = 'search';
//
// const ConfluenceHttpOpts = {
// 	skipCredentials: true
// };
//
// /**
//  * Constant types
//  */
// export function makeUrl(action:string) {
// 	return `https://gch6rd53le.execute-api.us-east-1.amazonaws.com/prod/support/confluence/${action}`;
// }
//
// export function makeContentUrl(id:string, query:string) {
// 	//https://getrads.atlassian.net/wiki/plugins/servlet/applinks/proxy?appId=a39b7480-8032-3176-9994-8aa4c7288ae5&path=https://getrads.atlassian.net/wiki/rest/api/content/12812302?expand=body.export_view
// 	//return `https://readonly:readonly@getrads.atlassian.net/wiki/rest/api/${path}`;
// 	let url = makeUrl(ContentPath);
// 	if (id)
// 		url += `/${id}`
// 	if (query)
// 		url += `?${query}`;
//
// 	return url;
// }
//
// export function makeSearchUrl(query:string) {
// 	//https://getrads.atlassian.net/wiki/plugins/servlet/applinks/proxy?appId=a39b7480-8032-3176-9994-8aa4c7288ae5&path=https://getrads.atlassian.net/wiki/rest/api/content/12812302?expand=body.export_view
// 	//return `https://readonly:readonly@getrads.atlassian.net/wiki/rest/api/${path}`;
// 	let url = makeUrl(SearchPath);
//
// 	if (query)
// 		url += `?q=${query}`;
//
// 	return url;
// }

//
// export class DocumentationActionFactory extends ActionFactory<DocumentationState,DocumentationActionMessage> {
//
// 	constructor() {
// 		super()
// 	}
//
// 	leaf():string {
// 		return DocumentationKey
// 	}
//
//
// 	stateType():any {
// 		return DocumentationState
// 	}
//
// 	@ActionDescriptor()
// 	updateDocument(id:string,documentUpdates) {}
//
// 	@ActionDescriptor()
// 	showDocument(id:string,isTip:boolean) {}
//
// 	@ActionDescriptor()
// 	retrieveDocument(id:string,isTip:boolean = false) {
//
// 		return (dispatch, getState) => {
// 			const actions = this.withDispatcher(dispatch)
//
// 			if (!id) {
// 				return actions.showDocument(id,isTip)
// 			}
//
// 			let state:DocumentationState = getState().documentation;
//
// 			/**
// 			 * Triggers show action when document is loaded
// 			 *
// 			 * @returns {Promise<T>}
// 			 */
// 			function triggerShow() {
//
// 				return Promise.resolve(actions.showDocument(id,isTip));
// 			}
//
// 			if (!state.contents[id]) {
// 				return (actions.getDocument(id) as any).then((body) => {
// 					log.info("Loaded document, now showing", body);
// 					return triggerShow();
// 				});
// 			}
//
// 			return triggerShow();
// 		};
// 	}
//
// 	@ActionDescriptor()
// 	searchStarted(query:string) {}
//
// 	@ActionDescriptor()
// 	searchCompleted(results:Document[]) {}
//
// 	@ActionDescriptor()
// 	search(query:string) {
// 		let url = makeSearchUrl(query);
// 		log.info(`Getting confluence search ${url}`);
//
// 		return (dispatch) => {
// 			const actions = this.withDispatcher(dispatch)
// 			actions.searchStarted(query);
//
// 			return HttpClient.get(url, ConfluenceHttpOpts)
// 				.then((data:any) => {
// 					const results = []
// 					log.info("Search results", data);
// 					data.results.forEach((confluenceDocument) => {
// 						let id = _.get(confluenceDocument, 'content.id') as string
// 						let title = _.get(confluenceDocument, 'content.title') as string
//
// 						if (id && title) {
// 							results.push(new Document({id, title}));
// 						}
// 					});
//
// 					actions.searchCompleted(results)
//
// 					log.info('search parsed results', results);
//
// 					return Promise.resolve(results);
// 				}).catch((err) => {
// 					log.error("Failed to search", err)
// 					actions.searchCompleted([])
// 					actions.setError(err)
// 					return Promise.reject(err)
// 				});
// 		};
//
// 	}
//
// 	/**
// 	 * Load a document from confluence
// 	 *
// 	 * @param id
// 	 * @returns {*|Promise|Promise.<TResult>}
// 	 */
// 	loadDocument(id:string) {
//
//
// 		let url = makeContentUrl(id, 'expand=body.export_view')
// 		log.info(`Getting confluence content ${url}`)
//
// 		return HttpClient.get(url, ConfluenceHttpOpts)
// 			.then((data:ConfluenceDocument) => {
// 				let body = _.get(data, 'body.export_view.value')
// 				let title = _.get(data, 'title')
//
// 				if (!body || !title) {
// 					log.error("No document body or title received", body, data)
// 					throw new Error(`No document body or title received ${url}`)
// 				}
//
// 				log.info('Received confluence manifest', data, 'extracted', body)
//
// 				return Promise.resolve({body, title})
// 			})
//
// 	}
//
// 	@ActionDescriptor()
// 	getDocument(id:string) {
// 		return (dispatch, getState) => {
// 			const actions = this.withDispatcher(dispatch)
//
// 			let state:DocumentationState = getState().documentation
//
// 			let content = state.contents[id]
// 			if (content && content.loaded === true) {
// 				return Promise.resolve(content.body)
// 			}
//
//
// 			actions.updateDocument(id,{status:ResourceStatus.Loading})
//
// 			return actions.loadDocument(id)
// 				.then((doc) => {
// 					actions.updateDocument(id,doc)
// 					return Promise.resolve(doc)
// 				})
// 				.catch((err) => {
// 					log.error('Tip manifest get failed', err)
//
// 					actions.updateDocument(id,{status:ResourceStatus.NotLoaded})
// 					actions.setError(err)
// 					return Promise.reject(err)
// 				})
// 		}
// 	}
//
// }
//
//
//
//

