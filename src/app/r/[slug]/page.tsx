import { notFound } from "next/navigation";
import { getPublicMenuBySlug } from "@/lib/menu-data";
import { MenuClient } from "@/components/menu/menu-client";

export const dynamic = "force-dynamic";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicMenuBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <MenuClient
      restaurant={data.restaurant}
      categories={data.categories}
      deliveryZones={data.deliveryZones}
    />
  );
}
