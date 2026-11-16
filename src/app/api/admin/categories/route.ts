import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { categorySchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      restaurantId: session.user.restaurantId,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
