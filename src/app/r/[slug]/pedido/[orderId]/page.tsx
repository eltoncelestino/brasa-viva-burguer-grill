import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderTrackingClient } from "@/components/menu/order-tracking-client";

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurant: { slug },
    },
    include: {
      restaurant: {
        select: { name: true, slug: true, address: true, phone: true },
      },
      table: { select: { number: true } },
      deliveryZone: { select: { neighborhood: true, estimatedMinutes: true } },
      items: {
        include: { addons: true },
      },
      payment: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <OrderTrackingClient
      initialOrder={{
        ...order,
        payment: order.payment
          ? {
              ...order.payment,
              expiresAt: order.payment.expiresAt?.toISOString() ?? null,
              paidAt: order.payment.paidAt?.toISOString() ?? null,
            }
          : null,
      }}
    />
  );
}
