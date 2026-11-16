import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { productSchema } from "@/lib/validators";
import { parseBadges } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    products: products.map((p) => ({ ...p, badges: parseBadges(p.badges) })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados do produto inválidos." },
      { status: 400 }
    );
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: session.user.restaurantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      priceCents: parsed.data.priceCents,
      imageUrl: parsed.data.imageUrl || null,
      badges: JSON.stringify(parsed.data.badges),
      isAvailable: parsed.data.isAvailable,
      sortOrder: parsed.data.sortOrder,
      categoryId: parsed.data.categoryId,
      restaurantId: session.user.restaurantId,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    { product: { ...product, badges: parseBadges(product.badges) } },
    { status: 201 }
  );
}
