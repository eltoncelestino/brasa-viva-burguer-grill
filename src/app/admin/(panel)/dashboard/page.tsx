import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    redirect("/admin/login");
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      status: { not: "CANCELLED" },
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalOrders = orders.length;
  const totalRevenueCents = orders.reduce((acc, o) => acc + o.totalCents, 0);
  const averageTicketCents =
    totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

  // Agrupamento diário
  const dailyMap = new Map<string, { revenueCents: number; orders: number }>();
  for (const order of orders) {
    const dayKey = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Fortaleza",
    }).format(order.createdAt);

    const prev = dailyMap.get(dayKey) ?? { revenueCents: 0, orders: 0 };
    dailyMap.set(dayKey, {
      revenueCents: prev.revenueCents + order.totalCents,
      orders: prev.orders + 1,
    });
  }

  const dailyRevenue = Array.from(dailyMap.entries()).map(([day, val]) => ({
    day,
    revenueReais: Number((val.revenueCents / 100).toFixed(2)),
    orders: val.orders,
  }));

  // Produtos mais vendidos
  const productCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      productCounts.set(
        item.productName,
        (productCounts.get(item.productName) ?? 0) + item.quantity
      );
    }
  }

  const topProducts = Array.from(productCounts.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  return (
    <AnalyticsDashboard
      totalRevenueCents={totalRevenueCents}
      totalOrders={totalOrders}
      averageTicketCents={averageTicketCents}
      dailyRevenue={dailyRevenue}
      topProducts={topProducts}
    />
  );
}
