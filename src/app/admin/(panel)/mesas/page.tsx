import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { TablesQrManager } from "@/components/admin/tables-qr-manager";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    redirect("/admin/login");
  }

  const [restaurant, tables] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { name: true, slug: true },
    }),
    prisma.table.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { number: "asc" },
    }),
  ]);

  if (!restaurant) {
    redirect("/admin/login");
  }

  return (
    <TablesQrManager
      restaurantSlug={restaurant.slug}
      restaurantName={restaurant.name}
      initialTables={tables}
    />
  );
}
