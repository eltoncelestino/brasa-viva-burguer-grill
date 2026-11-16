import { prisma } from "@/lib/prisma";
import { parseBadges } from "@/lib/utils";

export async function getPublicMenuBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) return null;

  const [categories, deliveryZones] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: { orderBy: { sortOrder: "asc" } },
            addonGroups: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    }),
    prisma.deliveryZone.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      orderBy: { feeCents: "asc" },
    }),
  ]);

  return {
    restaurant,
    categories: categories
      .filter((c) => c.products.length > 0)
      .map((c) => ({
        ...c,
        products: c.products.map((p) => ({
          ...p,
          badges: parseBadges(p.badges),
        })),
      })),
    deliveryZones,
  };
}
