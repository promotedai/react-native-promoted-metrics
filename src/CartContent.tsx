import type { Content } from "./Content"
import type { Money } from "./Money"

/** Item of content in a shopping cart. */
export type CartContent = {
  content: Content
  quantity: number
  pricePerUnit?: Money
}
