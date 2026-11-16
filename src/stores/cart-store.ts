import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartAddon {
  id: string;
  name: string;
  priceCents: number;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  imageUrl?: string | null;
  basePriceCents: number;
  variantId?: string | null;
  variantName?: string | null;
  variantPriceCents: number;
  addons: CartAddon[];
  quantity: number;
  notes?: string;
}

interface CartState {
  restaurantSlug: string | null;
  tableNumber: number | null;
  items: CartItem[];
  isOpen: boolean;
  setContext: (restaurantSlug: string, tableNumber?: number | null) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "cartItemId">) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
}

function buildCartItemId(item: Omit<CartItem, "cartItemId">): string {
  const addonIds = item.addons
    .map((a) => a.id)
    .sort()
    .join(",");
  const notes = (item.notes ?? "").trim().toLowerCase();
  return `${item.productId}::${item.variantId ?? "none"}::${addonIds}::${notes}`;
}

export function getCartItemUnitPriceCents(item: CartItem): number {
  const addonsSum = item.addons.reduce((sum, a) => sum + a.priceCents, 0);
  return item.basePriceCents + item.variantPriceCents + addonsSum;
}

export function getCartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + getCartItemUnitPriceCents(item) * item.quantity, 0);
}

export function getCartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantSlug: null,
      tableNumber: null,
      items: [],
      isOpen: false,

      setContext: (restaurantSlug, tableNumber = null) => {
        const currentSlug = get().restaurantSlug;
        if (currentSlug && currentSlug !== restaurantSlug) {
          set({ restaurantSlug, tableNumber, items: [] });
        } else {
          set({ restaurantSlug, tableNumber });
        }
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (newItem) => {
        const cartItemId = buildCartItemId(newItem);
        set((state) => {
          const existing = state.items.find((i) => i.cartItemId === cartItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartItemId === cartItemId
                  ? { ...i, quantity: Math.min(50, i.quantity + newItem.quantity) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...newItem, cartItemId }],
          };
        });
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((i) => i.cartItemId !== cartItemId),
          }));
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity: Math.min(50, quantity) } : i
          ),
        }));
      },

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "brasa-viva-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        restaurantSlug: state.restaurantSlug,
        tableNumber: state.tableNumber,
        items: state.items,
      }),
    }
  )
);
