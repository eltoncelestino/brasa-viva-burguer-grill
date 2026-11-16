import { notFound } from "next/navigation";
import { getPublicMenuBySlug } from "@/lib/menu-data";
import { MenuClient } from "@/components/menu/menu-client";

export const dynamic = "force-dynamic";

export default async function TableMenuPage({
  params,
}: {
  params: Promise<{ slug: string; numero: string }>;
}) {
  const { slug, numero } = await params;
  const tableNum = parseInt(numero, 10);

  if (!Number.isInteger(tableNum) || tableNum < 1) {
    notFound();
  }

  const data = await getPublicMenuBySlug(slug);
  if (!data) {
    notFound();
  }

  return (
    <MenuClient
      restaurant={data.restaurant}
      categories={data.categories}
      deliveryZones={data.deliveryZones}
      tableNumber={tableNum}
    />
  );
}
