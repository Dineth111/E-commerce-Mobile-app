import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, Product, Size, Color } from '@/types';

interface CartState {
  items: CartItem[];
  promoCode: string;
  promoDiscount: number;
  // Actions
  addItem: (product: Product, size: Size, color: Color) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyPromoCode: (code: string) => void;
  clearCart: () => void;
  // Computed
  totalItems: () => number;
  subtotal: () => number;
  total: () => number;
}

const PROMO_CODES: Record<string, number> = {
  WELCOME20: 20,
  STYLE15: 15,
  LUXURY10: 10,
  VIBE25: 25,
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: '',
      promoDiscount: 0,

      addItem: (product, size, color) => {
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.size === size && i.color.name === color.name
        );
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              {
                id: `${product.id}-${size}-${color.name}-${Date.now()}`,
                product,
                size,
                color,
                quantity: 1,
              },
            ],
          }));
        }
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      applyPromoCode: (code) => {
        const discount = PROMO_CODES[code.toUpperCase()];
        if (discount) {
          set({ promoCode: code.toUpperCase(), promoDiscount: discount });
        } else {
          set({ promoCode: '', promoDiscount: 0 });
          throw new Error('Invalid promo code');
        }
      },

      clearCart: () => set({ items: [], promoCode: '', promoDiscount: 0 }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      total: () => {
        const sub = get().subtotal();
        const discount = get().promoDiscount;
        return sub * (1 - discount / 100);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
