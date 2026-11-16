import { describe, it, expect } from "vitest";
import {
  calculateItemTotals,
  calculateCartSummary,
  priceOrderItemsFromCatalog,
  canTransitionOrderStatus,
  type ServerCatalogProduct,
} from "../order-rules";

const sampleCatalog = new Map<string, ServerCatalogProduct>([
  [
    "prod-burger",
    {
      id: "prod-burger",
      name: "Brasa Clássico Aldeota",
      priceCents: 3690,
      isAvailable: true,
      variants: [
        { id: "var-ao-ponto", name: "Ao Ponto", priceCents: 0 },
        { id: "var-duplo", name: "Duplo Blend", priceCents: 1200 },
      ],
      addonGroups: [
        {
          id: "grp-brasa",
          name: "Adicionais na Brasa",
          minSelect: 0,
          maxSelect: 2,
          isRequired: false,
          options: [
            { id: "opt-bacon", name: "Bacon Crocante", priceCents: 600, isAvailable: true },
            { id: "opt-cheddar", name: "Cheddar Inglês", priceCents: 550, isAvailable: true },
            { id: "opt-indisp", name: "Ouro Comestível", priceCents: 9900, isAvailable: false },
          ],
        },
      ],
    },
  ],
  [
    "prod-esgotado",
    {
      id: "prod-esgotado",
      name: "Costela Defumada",
      priceCents: 7990,
      isAvailable: false,
      variants: [],
      addonGroups: [],
    },
  ],
]);

describe("Regras de Cálculo do Carrinho (Centavos BRL)", () => {
  it("calcula preço unitário e total de item com variante e adicionais", () => {
    const result = calculateItemTotals({
      basePriceCents: 3690,
      variantPriceCents: 1200,
      addonPricesCents: [600, 550],
      quantity: 2,
    });

    expect(result.unitPriceCents).toBe(6040);
    expect(result.totalPriceCents).toBe(12080);
  });

  it("rejeita quantidade inválida (menor que 1 ou não inteira)", () => {
    expect(() =>
      calculateItemTotals({
        basePriceCents: 3690,
        variantPriceCents: 0,
        addonPricesCents: [],
        quantity: 0,
      })
    ).toThrow();
  });

  it("calcula subtotal, taxa de entrega e total geral do pedido", () => {
    const summary = calculateCartSummary(
      [
        { basePriceCents: 3690, variantPriceCents: 0, addonPricesCents: [600], quantity: 1 },
        { basePriceCents: 1490, variantPriceCents: 0, addonPricesCents: [], quantity: 2 },
      ],
      800 // Taxa Meireles R$ 8,00
    );

    expect(summary.subtotalCents).toBe(4290 + 2980);
    expect(summary.deliveryFeeCents).toBe(800);
    expect(summary.totalCents).toBe(8070);
  });
});

describe("Validação e Recálculo de Preços no Servidor", () => {
  it("recalcula preços confiáveis ignorando qualquer valor do cliente", () => {
    const { pricedItems, subtotalCents } = priceOrderItemsFromCatalog(
      [
        {
          productId: "prod-burger",
          variantId: "var-duplo",
          addonOptionIds: ["opt-bacon"],
          quantity: 2,
          notes: "  Bem selado  ",
        },
      ],
      sampleCatalog
    );

    expect(pricedItems).toHaveLength(1);
    expect(pricedItems[0]!.unitPriceCents).toBe(3690 + 1200 + 600);
    expect(pricedItems[0]!.totalPriceCents).toBe((3690 + 1200 + 600) * 2);
    expect(pricedItems[0]!.notes).toBe("Bem selado");
    expect(subtotalCents).toBe(10980);
  });

  it("bloqueia produto indisponível", () => {
    expect(() =>
      priceOrderItemsFromCatalog(
        [{ productId: "prod-esgotado", addonOptionIds: [], quantity: 1 }],
        sampleCatalog
      )
    ).toThrow(/indisponível/i);
  });

  it("bloqueia adicional indisponível ou inválido", () => {
    expect(() =>
      priceOrderItemsFromCatalog(
        [
          {
            productId: "prod-burger",
            variantId: "var-ao-ponto",
            addonOptionIds: ["opt-indisp"],
            quantity: 1,
          },
        ],
        sampleCatalog
      )
    ).toThrow(/Adicional inválido/i);
  });

  it("bloqueia excesso de adicionais acima de maxSelect", () => {
    expect(() =>
      priceOrderItemsFromCatalog(
        [
          {
            productId: "prod-burger",
            variantId: "var-ao-ponto",
            addonOptionIds: ["opt-bacon", "opt-cheddar", "opt-bacon"],
            quantity: 1,
          },
        ],
        sampleCatalog
      )
    ).toThrow(/Limite máximo/i);
  });
});

describe("Transições de Status do Kanban", () => {
  it("permite fluxo sequencial NEW -> PREPARING -> READY -> FINISHED", () => {
    expect(canTransitionOrderStatus("NEW", "PREPARING")).toBe(true);
    expect(canTransitionOrderStatus("PREPARING", "READY")).toBe(true);
    expect(canTransitionOrderStatus("READY", "FINISHED")).toBe(true);
  });

  it("bloqueia saltos inválidos ou regressões após finalizado", () => {
    expect(canTransitionOrderStatus("NEW", "FINISHED")).toBe(false);
    expect(canTransitionOrderStatus("FINISHED", "NEW")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "PREPARING")).toBe(false);
    expect(canTransitionOrderStatus("NEW", "NEW")).toBe(false);
  });

  it("permite cancelamento antes da finalização", () => {
    expect(canTransitionOrderStatus("NEW", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("PREPARING", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("FINISHED", "CANCELLED")).toBe(false);
  });
});
