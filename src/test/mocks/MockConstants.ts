
export const
  MockKey = 'mock',
  MockStateStr1 = 'my first string'


export function getDefaultMockState(reducer) {
  // noinspection TypeScriptValidateJSTypes
  return reducer.handle(
    null,
    { type:'@INIT' }
  )
}
