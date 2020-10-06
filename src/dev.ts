import {Option} from "@3fv/prelude-ts"

export const isDev = Option.try(
  () => process.env.NODE_ENV === "development" ?? false
).getOrElse(false)
