"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import {
  useCartStore,
  getCartItemUnitPriceCents,
  getCartSubtotalCents,
} from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const subtotalCents = getCartSubtotalCents(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Sua sacola de pedidos"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Sua Sacola</h2>
                  <p className="text-xs text-zinc-500">
                    {items.length === 0
                      ? "Nenhum item adicionado"
                      : `${items.reduce((s, i) => s + i.quantity, 0)} item(ns)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Fechar sacola"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <p className="text-base font-semibold text-zinc-900">
                    Sua sacola está vazia
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-zinc-500">
                    Explore nossos burgers na brasa e cortes especiais para montar seu pedido.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const unitCents = getCartItemUnitPriceCents(item);
                      return (
                        <motion.li
                          key={item.cartItemId}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-zinc-900">
                                {item.productName}
                              </h3>
                              {item.variantName && (
                                <p className="text-xs text-zinc-600">{item.variantName}</p>
                              )}
                              {item.addons.length > 0 && (
                                <p className="mt-1 text-xs text-zinc-500">
                                  + {item.addons.map((a) => a.name).join(", ")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                  Obs: {item.notes}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              aria-label={`Remover ${item.productName}`}
                              onClick={() => removeItem(item.cartItemId)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
                              <button
                                type="button"
                                aria-label="Diminuir"
                                onClick={() =>
                                  updateQuantity(item.cartItemId, item.quantity - 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-zinc-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Aumentar"
                                onClick={() =>
                                  updateQuantity(item.cartItemId, item.quantity + 1)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <span className="text-sm font-extrabold text-zinc-900">
                              {formatCurrency(unitCents * item.quantity)}
                            </span>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-zinc-100 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600">Subtotal</span>
                  <span className="text-lg font-extrabold text-zinc-900">
                    {formatCurrency(subtotalCents)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    closeCart();
                    onCheckout();
                  }}
                  className="w-full justify-between"
                >
                  <span>Finalizar Pedido</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
