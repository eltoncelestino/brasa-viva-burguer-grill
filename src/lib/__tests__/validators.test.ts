import { describe, it, expect } from "vitest";
import { createOrderSchema } from "../validators";

describe("Validação Zod de Checkout (createOrderSchema)", () => {
  it("valida pedido Delivery em Fortaleza e normaliza telefone", () => {
    const parsed = createOrderSchema.safeParse({
      restaurantSlug: "brasa-viva",
      type: "DELIVERY",
      customerName: "Ana Paula",
      customerPhone: "(85) 99988-7766",
      deliveryZoneId: "zone-aldeota",
      deliveryAddress: "Av. Santos Dumont, 2400 - Aldeota",
      paymentMethod: "PIX",
      items: [{ productId: "p1", quantity: 1, addonOptionIds: [] }],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.customerPhone).toBe("85999887766");
    }
  });

  it("exige bairro e endereço para Delivery", () => {
    const parsed = createOrderSchema.safeParse({
      restaurantSlug: "brasa-viva",
      type: "DELIVERY",
      customerName: "Ana Paula",
      customerPhone: "85999887766",
      items: [{ productId: "p1", quantity: 1 }],
    });

    expect(parsed.success).toBe(false);
  });

  it("exige número da mesa para pedido DINE_IN", () => {
    const parsed = createOrderSchema.safeParse({
      restaurantSlug: "brasa-viva",
      type: "DINE_IN",
      customerName: "Carlos",
      customerPhone: "85988776655",
      items: [{ productId: "p1", quantity: 2 }],
    });

    expect(parsed.success).toBe(false);
  });
});
