import type { CartContent } from "./CartContent"

/** Shopping cart for `checkout` or `purchase` actions. */
export type Cart = {
  contents: Array<CartContent>
}
