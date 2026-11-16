import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { KanbanBoard, type AdminOrder } from "@/components/admin/kanban-board";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    redirect("/admin/login");
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { in: ["NEW", "PREPARING", "READY", "FINISHED"] },
    },
    include: {
      items: { include: { addons: true } },
      table: { select: { number: true } },
      deliveryZone: { select: { neighborhood: true } },
      payment: { select: { method: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const serialized: AdminOrder[] = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <KanbanBoard
      restaurantId={session.user.restaurantId}
      initialOrders={serialized}
    />
  );
}
