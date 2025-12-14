import { Cart as CartType } from '@/payload-types'
import { CartModal } from './cart-modal'

export type CartItem = NonNullable<CartType['items']>[number]

export function Cart() {
  return <CartModal />
}
