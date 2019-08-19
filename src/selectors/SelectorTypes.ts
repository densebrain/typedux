import {State} from "../reducers/State"


export type Selector<S extends State<string>, R> = (state:S) => R
