import type { CurrencyCode } from "./CurrencyCode"

/** Money amount for transactions. */
export type Money = {
  currencyCode: CurrencyCode
  amountMicros: number
}
