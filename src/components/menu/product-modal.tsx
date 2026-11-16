"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Check, Flame } from "lucide-react";
import { toast } from "sonner";
import type { MenuProduct } from "@/types/menu";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";

interface ProductModalProps {
  product: MenuProduct | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const addItem = useCartStore((s) => s.addItem);

  const defaultVariantId = useMemo(() => {
    if (!product?.variants.length) return null;
    return (
      product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id ?? null
    );
  }, [product]);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultVariantId);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Sincroniza variante padrão quando o produto muda
  const activeVariantId =
    selectedVariantId && product?.variants.some((v) => v.id === selectedVariantId)
      ? selectedVariantId
      : defaultVariantId;

  const selectedVariant = product?.variants.find((v) => v.id === activeVariantId) ?? null;

  const allOptions = useMemo(() => {
    if (!product) return [];
    return product.addonGroups.flatMap((g) => g.options);
  }, [product]);

  const selectedAddons = useMemo(
    () => allOptions.filter((opt) => selectedAddonIds.includes(opt.id)),
    [allOptions, selectedAddonIds]
  );

  const unitPriceCents = useMemo(() => {
    if (!product) return 0;
    const addonsSum = selectedAddons.reduce((sum, a) => sum + a.priceCents, 0);
    return product.priceCents + (selectedVariant?.priceCents ?? 0) + addonsSum;
  }, [product, selectedVariant, selectedAddons]);

  const toggleAddon = (groupId: string, optionId: string, maxSelect: number) => {
    setSelectedAddonIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      const group = product?.addonGroups.find((g) => g.id === groupId);
      if (!group) return prev;
      const groupOptionIds = new Set(group.options.map((o) => o.id));
      const countInGroup = prev.filter((id) => groupOptionIds.has(id)).length;
      if (countInGroup >= maxSelect) {
        toast.info(`Você pode escolher no máximo ${maxSelect} opções em "${group.name}".`);
        return prev;
      }
      return [...prev, optionId];
    });
  };

  const handleConfirm = () => {
    if (!product) return;

    for (const group of product.addonGroups) {
      const groupOptionIds = new Set(group.options.map((o) => o.id));
      const countInGroup = selectedAddonIds.filter((id) => groupOptionIds.has(id)).length;
      const minRequired = group.isRequired ? Math.max(1, group.minSelect) : group.minSelect;
      if (countInGroup < minRequired) {
        toast.error(`Selecione ao menos ${minRequired} opção em "${group.name}".`);
        return;
      }
    }

    addItem({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      basePriceCents: product.priceCents,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      variantPriceCents: selectedVariant?.priceCents ?? 0,
      addons: selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        priceCents: a.priceCents,
      })),
      quantity,
      notes: notes.trim() || undefined,
    });

    toast.success(`${product.name} adicionado à sacola!`);
    setSelectedAddonIds([]);
    setNotes("");
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            {/* Imagem de capa */}
            <div className="relative h-52 w-full shrink-0 bg-zinc-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-orange-50 text-orange-400">
                  <Flame className="h-12 w-12" />
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar detalhes do produto"
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <div>
                <h2 id="product-modal-title" className="text-xl font-bold text-zinc-900">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                    {product.description}
                  </p>
                )}
                <p className="mt-2 text-lg font-extrabold text-orange-600">
                  {formatCurrency(product.priceCents)}
                </p>
              </div>

              {/* Variantes (Ponto da carne / Sabor) */}
              {product.variants.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-800">
                      Escolha a opção
                    </h3>
                    <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Obrigatório
                    </span>
                  </div>
                  <div className="space-y-2">
                    {product.variants.map((variant) => {
                      const isSelected = variant.id === activeVariantId;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer",
                            isSelected
                              ? "border-orange-600 bg-orange-50/70 ring-1 ring-orange-600"
                              : "border-zinc-200 hover:border-zinc-300"
                          )}
                        >
                          <span className="text-sm font-semibold text-zinc-900">
                            {variant.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {variant.priceCents > 0 && (
                              <span className="text-xs font-semibold text-zinc-600">
                                +{formatCurrency(variant.priceCents)}
                              </span>
                            )}
                            <span
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border",
                                isSelected
                                  ? "border-orange-600 bg-orange-600 text-white"
                                  : "border-zinc-300"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grupos de Adicionais */}
              {product.addonGroups.map((group) => (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-800">
                        {group.name}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Escolha até {group.maxSelect} {group.maxSelect === 1 ? "opção" : "opções"}
                      </p>
                    </div>
                    {group.isRequired && (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        Obrigatório
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {group.options
                      .filter((o) => o.isAvailable)
                      .map((opt) => {
                        const checked = selectedAddonIds.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleAddon(group.id, opt.id, group.maxSelect)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer",
                              checked
                                ? "border-orange-600 bg-orange-50/60"
                                : "border-zinc-200 hover:border-zinc-300"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{opt.name}</p>
                              <p className="text-xs font-semibold text-orange-600">
                                +{formatCurrency(opt.priceCents)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-md border transition",
                                checked
                                  ? "border-orange-600 bg-orange-600 text-white"
                                  : "border-zinc-300 bg-white"
                              )}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}

              {/* Observações */}
              <div className="space-y-2">
                <label
                  htmlFor="product-notes"
                  className="block text-sm font-bold uppercase tracking-wide text-zinc-800"
                >
                  Alguma observação?
                </label>
                <textarea
                  id="product-notes"
                  rows={2}
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: tirar cebola, molho à parte, cortar ao meio..."
                  className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Rodapé fixo com quantidade + botão Adicionar */}
            <div className="flex items-center gap-3 border-t border-zinc-100 bg-white p-4">
              <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-white cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-zinc-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={handleConfirm}
                className="flex-1 justify-between"
              >
                <span>Adicionar</span>
                <span>{formatCurrency(unitPriceCents * quantity)}</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
