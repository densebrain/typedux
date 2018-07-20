

export interface IStateConstructor<T> {
	new (o?:any):T
	fromJS(o:any):T
}




export interface State<T> {
	type:T
	[key:string]:any
}

export type TRootState = State<string> & {[key:string]:{[key:string]:any}}