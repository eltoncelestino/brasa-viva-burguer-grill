import type { OrderStatus } from "@prisma/client";

export interface CartCalculationItem {
  basePriceCents: number;
  variantPriceCents: number;
  addonPricesCents: number[];
  quantity: number;
}

export interface ServerCatalogProduct {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  variants: Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
  addonGroups: Array<{
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    options: Array<{
      id: string;
      name: string;
      priceCents: number;
      isAvailable: boolean;
    }>;
  }>;
}

export interface RequestedOrderItem {
  productId: string;
  variantId?: string | null;
  addonOptionIds: string[];
  quantity: number;
  notes?: string;
}

export interface PricedOrderItem {
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  notes: string | null;
  addons: Array<{
    addonOptionId: string;
    addonName: string;
    priceCents: number;
  }>;
}

/**
 * Calcula o preço unitário e total de um item do carrinho em centavos inteiros.
 */
export function calculateItemTotals(item: CartCalculationItem): {
  unitPriceCents: number;
  totalPriceCents: number;
} {
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    throw new Error("Quantidade do item deve ser um inteiro positivo.");
  }
  const addonsSum = item.addonPricesCents.reduce((acc, price) => acc + Math.max(0, Math.round(price)), 0);
  const unitPriceCents =
    Math.max(0, Math.round(item.basePriceCents)) +
    Math.max(0, Math.round(item.variantPriceCents)) +
    addonsSum;
  return {
    unitPriceCents,
    totalPriceCents: unitPriceCents * item.quantity,
  };
}

/**
 * Calcula subtotal, taxa de entrega e total geral do pedido em centavos.
 */
export function calculateCartSummary(
  items: CartCalculationItem[],
  deliveryFeeCents: number = 0
): {
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
} {
  const subtotalCents = items.reduce((acc, item) => {
    const { totalPriceCents } = calculateItemTotals(item);
    return acc + totalPriceCents;
  }, 0);
  const safeDeliveryFee = Math.max(0, Math.round(deliveryFeeCents));
  return {
    subtotalCents,
    deliveryFeeCents: safeDeliveryFee,
    totalCents: subtotalCents + safeDeliveryFee,
  };
}

/**
 * Recalcula preços exclusivamente a partir dos dados confiáveis do servidor (nunca confia no cliente).
 */
export function priceOrderItemsFromCatalog(
  requestedItems: RequestedOrderItem[],
  catalogProducts: Map<string, ServerCatalogProduct>
): {
  pricedItems: PricedOrderItem[];
  subtotalCents: number;
} {
  const pricedItems: PricedOrderItem[] = [];
  let subtotalCents = 0;

  for (const req of requestedItems) {
    const product = catalogProducts.get(req.productId);
    if (!product) {
      throw new Error(`Produto não encontrado: ${req.productId}`);
    }
    if (!product.isAvailable) {
      throw new Error(`O produto "${product.name}" está indisponível no momento.`);
    }

    let variantId: string | null = null;
    let variantName: string | null = null;
    let variantPriceCents = 0;

    if (req.variantId) {
      const variant = product.variants.find((v) => v.id === req.variantId);
      if (!variant) {
        throw new Error(`Variante inválida selecionada para "${product.name}".`);
      }
      variantId = variant.id;
      variantName = variant.name;
      variantPriceCents = variant.priceCents;
    }

    const availableOptions = new Map<
      string,
      { id: string; name: string; priceCents: number; groupId: string }
    >();
    for (const group of product.addonGroups) {
      for (const opt of group.options) {
        if (opt.isAvailable) {
          availableOptions.set(opt.id, {
            id: opt.id,
            name: opt.name,
            priceCents: opt.priceCents,
            groupId: group.id,
          });
        }
      }
    }

    const selectedAddons: Array<{
      addonOptionId: string;
      addonName: string;
      priceCents: number;
      groupId: string;
    }> = [];

    for (const optionId of req.addonOptionIds) {
      const option = availableOptions.get(optionId);
      if (!option) {
        throw new Error(`Adicional inválido ou indisponível para "${product.name}".`);
      }
      selectedAddons.push({
        addonOptionId: option.id,
        addonName: option.name,
        priceCents: option.priceCents,
        groupId: option.groupId,
      });
    }

    // Valida limites minSelect / maxSelect de cada grupo de adicionais
    for (const group of product.addonGroups) {
      const countInGroup = selectedAddons.filter((a) => a.groupId === group.id).length;
      if (group.isRequired && countInGroup < Math.max(1, group.minSelect)) {
        throw new Error(`Selecione ao menos ${Math.max(1, group.minSelect)} opção em "${group.name}".`);
      }
      if (countInGroup < group.minSelect) {
        throw new Error(`Selecione ao menos ${group.minSelect} opção em "${group.name}".`);
      }
      if (countInGroup > group.maxSelect) {
        throw new Error(`Limite máximo de ${group.maxSelect} opções excedido em "${group.name}".`);
      }
    }

    const { unitPriceCents, totalPriceCents } = calculateItemTotals({
      basePriceCents: product.priceCents,
      variantPriceCents,
      addonPricesCents: selectedAddons.map((a) => a.priceCents),
      quantity: req.quantity,
    });

    subtotalCents += totalPriceCents;

    pricedItems.push({
      productId: product.id,
      productName: product.name,
      variantId,
      variantName,
      quantity: req.quantity,
      unitPriceCents,
      totalPriceCents,
      notes: req.notes?.trim() ? req.notes.trim() : null,
      addons: selectedAddons.map(({ addonOptionId, addonName, priceCents }) => ({
        addonOptionId,
        addonName,
        priceCents,
      })),
    });
  }

  return { pricedItems, subtotalCents };
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["FINISHED", "CANCELLED"],
  FINISHED: [],
  CANCELLED: [],
};

/**
 * Verifica se a transição de status do pedido é permitida pelo fluxo Kanban.
 */
export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Novo",
  PREPARING: "Em preparo",
  READY: "Pronto",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};
