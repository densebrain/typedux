
import {Map} from 'immutable'


export interface IStateConstructor<T> {
	new (o?:any):T
	fromJS(o:any):T
}



//export interface State extends Immutable.Map<string,any> {
export interface State {

}

export type TRootState = Map<string,Map<string,any>>