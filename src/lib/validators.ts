import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
  variantId: z.string().nullable().optional(),
  addonOptionIds: z.array(z.string().min(1)).default([]),
  quantity: z.number().int().min(1, "Quantidade mínima é 1").max(50, "Quantidade máxima por item é 50"),
  notes: z.string().max(300, "Observação muito longa").optional(),
});

export const createOrderSchema = z
  .object({
    restaurantSlug: z.string().min(1),
    type: z.enum(["DINE_IN", "TAKEOUT", "DELIVERY"]),
    customerName: z.string().trim().min(2, "Informe seu nome completo").max(100),
    customerPhone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido (DDD + número)"),
    tableNumber: z.number().int().positive().nullable().optional(),
    deliveryZoneId: z.string().nullable().optional(),
    deliveryAddress: z.string().trim().max(250).nullable().optional(),
    notes: z.string().trim().max(400).nullable().optional(),
    paymentMethod: z.enum(["PIX", "CARD_ON_DELIVERY", "CASH"]).default("PIX"),
    items: z.array(checkoutItemSchema).min(1, "Adicione ao menos 1 item ao carrinho"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "DINE_IN" && !data.tableNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número da mesa é obrigatório para pedidos no salão",
        path: ["tableNumber"],
      });
    }
    if (data.type === "DELIVERY") {
      if (!data.deliveryZoneId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o bairro de entrega em Fortaleza",
          path: ["deliveryZoneId"],
        });
      }
      if (!data.deliveryAddress || data.deliveryAddress.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o endereço completo (rua, número e complemento)",
          path: ["deliveryAddress"],
        });
      }
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "READY", "FINISHED", "CANCELLED"]),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(60),
  description: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Nome do produto obrigatório").max(100),
  description: z.string().trim().max(500).optional().nullable(),
  priceCents: z.number().int().min(100, "Preço mínimo é R$ 1,00"),
  imageUrl: z.string().url("URL de imagem inválida").optional().nullable().or(z.literal("")),
  badges: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  categoryId: z.string().min(1, "Categoria obrigatória"),
});

export const pixWebhookSchema = z.object({
  event: z.enum(["payment.paid", "payment.expired", "payment.failed"]),
  externalId: z.string().min(1),
  paidAt: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
