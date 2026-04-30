import { create } from "zustand";
import type { CartItem, MenuItem } from "@/data/menuData";

export type OrderType = "dine-in" | "take-away";

export interface Customizations {
  added: string[];
  removed: string[];
}

const sameCustomizations = (a?: Customizations, b?: Customizations) => {
  const aAdd = [...(a?.added ?? [])].sort().join("|");
  const bAdd = [...(b?.added ?? [])].sort().join("|");
  const aRem = [...(a?.removed ?? [])].sort().join("|");
  const bRem = [...(b?.removed ?? [])].sort().join("|");
  return aAdd === bAdd && aRem === bRem;
};

const cartLineKey = (itemId: string, c?: Customizations) =>
  `${itemId}::${[...(c?.added ?? [])].sort().join(",")}::${[...(c?.removed ?? [])].sort().join(",")}`;

interface OrderState {
  orderType: OrderType | null;
  cart: CartItem[];
  setOrderType: (type: OrderType) => void;
  addToCart: (item: MenuItem, customizations?: Customizations) => void;
  removeFromCart: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTax: () => number;
  getSubtotal: () => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orderType: null,
  cart: [],

  setOrderType: (type) => set({ orderType: type }),

  addToCart: (item, customizations) =>
    set((state) => {
      const existing = state.cart.find(
        (c) =>
          c.menuItem.id === item.id &&
          sameCustomizations(c.customizations, customizations),
      );
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.menuItem.id === item.id &&
            sameCustomizations(c.customizations, customizations)
              ? { ...c, quantity: c.quantity + 1 }
              : c
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          { menuItem: item, quantity: 1, customizations },
        ],
      };
    }),

  removeFromCart: (lineKey) =>
    set((state) => ({
      cart: state.cart.filter(
        (c) => cartLineKey(c.menuItem.id, c.customizations) !== lineKey,
      ),
    })),

  updateQuantity: (lineKey, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          cart: state.cart.filter(
            (c) => cartLineKey(c.menuItem.id, c.customizations) !== lineKey,
          ),
        };
      }
      return {
        cart: state.cart.map((c) =>
          cartLineKey(c.menuItem.id, c.customizations) === lineKey
            ? { ...c, quantity }
            : c,
        ),
      };
    }),

  clearCart: () => set({ cart: [], orderType: null }),

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  },

  getTax: () => {
    return get().getSubtotal() * 0.08;
  },

  getTotal: () => {
    const state = get();
    return state.getSubtotal() + state.getTax();
  },
}));

export { cartLineKey };
