import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validators";
import { priceOrderItemsFromCatalog, type ServerCatalogProduct } from "@/lib/order-rules";
import { getPaymentProvider } from "@/server/payments";
import { emitOrderCreated } from "@/server/socket";
import { auth } from "@/server/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: {
      items: {
        include: { addons: true },
      },
      table: true,
      deliveryZone: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados do pedido inválidos.";
      return NextResponse.json(
        { error: firstError, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: input.restaurantSlug },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
    }

    if (!restaurant.isOpen) {
      return NextResponse.json(
        { error: "O restaurante está fechado no momento." },
        { status: 400 }
      );
    }

    // Busca produtos confiáveis no banco para recalcular tudo no servidor
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        restaurantId: restaurant.id,
      },
      include: {
        variants: true,
        addonGroups: {
          include: { options: true },
        },
      },
    });

    const catalogMap = new Map<string, ServerCatalogProduct>();
    for (const p of dbProducts) {
      catalogMap.set(p.id, {
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        isAvailable: p.isAvailable,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          priceCents: v.priceCents,
        })),
        addonGroups: p.addonGroups.map((g) => ({
          id: g.id,
          name: g.name,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          isRequired: g.isRequired,
          options: g.options.map((o) => ({
            id: o.id,
            name: o.name,
            priceCents: o.priceCents,
            isAvailable: o.isAvailable,
          })),
        })),
      });
    }

    let pricedResult;
    try {
      pricedResult = priceOrderItemsFromCatalog(input.items, catalogMap);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Erro ao validar itens do pedido." },
        { status: 400 }
      );
    }

    // Valida mesa ou zona de entrega
    let tableId: string | null = null;
    if (input.type === "DINE_IN" && input.tableNumber) {
      const table = await prisma.table.findUnique({
        where: {
          restaurantId_number: {
            restaurantId: restaurant.id,
            number: input.tableNumber,
          },
        },
      });
      if (!table || !table.isActive) {
        return NextResponse.json(
          { error: `Mesa ${input.tableNumber} não encontrada ou inativa.` },
          { status: 400 }
        );
      }
      tableId = table.id;
    }

    let deliveryZoneId: string | null = null;
    let deliveryFeeCents = 0;

    if (input.type === "DELIVERY" && input.deliveryZoneId) {
      const zone = await prisma.deliveryZone.findFirst({
        where: {
          id: input.deliveryZoneId,
          restaurantId: restaurant.id,
          isActive: true,
        },
      });
      if (!zone) {
        return NextResponse.json(
          { error: "Bairro de entrega inválido ou indisponível." },
          { status: 400 }
        );
      }
      deliveryZoneId = zone.id;
      deliveryFeeCents = zone.feeCents;
    }

    const totalCents = pricedResult.subtotalCents + deliveryFeeCents;

    // Gera próximo número sequencial de pedido do restaurante
    const lastOrder = await prisma.order.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const nextOrderNumber = (lastOrder?.orderNumber ?? 100) + 1;

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        type: input.type,
        status: "NEW",
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.type === "DELIVERY" ? input.deliveryAddress ?? null : null,
        notes: input.notes ?? null,
        subtotalCents: pricedResult.subtotalCents,
        deliveryFeeCents,
        totalCents,
        restaurantId: restaurant.id,
        tableId,
        deliveryZoneId,
        items: {
          create: pricedResult.pricedItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.totalPriceCents,
            notes: item.notes,
            addons: {
              create: item.addons.map((a) => ({
                addonOptionId: a.addonOptionId,
                addonName: a.addonName,
                priceCents: a.priceCents,
              })),
            },
          })),
        },
      },
      include: {
        items: { include: { addons: true } },
        table: true,
        deliveryZone: true,
      },
    });

    // Cria registro de pagamento (Pix via Adapter ou Pagamento na Entrega/Balcão)
    let paymentRecord;
    if (input.paymentMethod === "PIX") {
      const provider = getPaymentProvider();
      const charge = await provider.createPixCharge({
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        amountCents: totalCents,
        customerName: input.customerName,
        description: `Pedido #${createdOrder.orderNumber} - ${restaurant.name}`,
      });

      paymentRecord = await prisma.payment.create({
        data: {
          orderId: createdOrder.id,
          method: "PIX",
          status: "PENDING",
          amountCents: totalCents,
          provider: charge.provider,
          externalId: charge.externalId,
          pixQrCode: charge.pixQrCode,
          pixCopyPaste: charge.pixCopyPaste,
          expiresAt: charge.expiresAt,
        },
      });
    } else {
      paymentRecord = await prisma.payment.create({
        data: {
          orderId: createdOrder.id,
          method: input.paymentMethod,
          status: "PENDING",
          amountCents: totalCents,
          provider: "offline",
        },
      });
    }

    const fullOrder = {
      ...createdOrder,
      payment: paymentRecord,
    };

    emitOrderCreated(restaurant.id, fullOrder);

    return NextResponse.json({ order: fullOrder }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar seu pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
