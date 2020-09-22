

export class Flag<D = any> {
  
  private state = {isSet: false}
  
  set() {
    this.state.isSet = true
    return this
  }
  
  get isSet() {
    return this.state.isSet
  }
  
  constructor(public data?:D) {
  
  }
}
