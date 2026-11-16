import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { parseBadges } from "@/lib/utils";
import { MenuManager } from "@/components/admin/menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    redirect("/admin/login");
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <MenuManager
      initialCategories={categories}
      initialProducts={products.map((p) => ({
        ...p,
        badges: parseBadges(p.badges),
      }))}
    />
  );
}
