import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusSchema } from "@/lib/validators";
import { canTransitionOrderStatus } from "@/lib/order-rules";
import { emitOrderUpdated } from "@/server/socket";
import { auth } from "@/server/auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      restaurant: {
        select: { id: true, name: true, slug: true, address: true, phone: true },
      },
      items: { include: { addons: true } },
      table: true,
      deliveryZone: true,
      payment: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = updateOrderStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const existing = await prisma.order.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (!canTransitionOrderStatus(existing.status, parsed.data.status)) {
    return NextResponse.json(
      {
        error: `Transição de status inválida: ${existing.status} → ${parsed.data.status}.`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
    include: {
      items: { include: { addons: true } },
      table: true,
      deliveryZone: true,
      payment: true,
    },
  });

  emitOrderUpdated(existing.restaurantId, updated.id, updated);

  return NextResponse.json({ order: updated });
}
