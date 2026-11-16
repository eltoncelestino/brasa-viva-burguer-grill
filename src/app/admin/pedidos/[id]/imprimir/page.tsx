import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { ThermalReceipt } from "@/components/admin/thermal-receipt";

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
    include: {
      restaurant: { select: { name: true, address: true, phone: true } },
      table: { select: { number: true } },
      deliveryZone: { select: { neighborhood: true } },
      payment: { select: { method: true, status: true } },
      items: { include: { addons: true } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <ThermalReceipt
      order={{
        ...order,
        createdAt: order.createdAt.toISOString(),
      }}
    />
  );
}
