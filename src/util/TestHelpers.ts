import {negate, isEmpty} from "lodash"

export const isNotEmpty = negate(isEmpty)
