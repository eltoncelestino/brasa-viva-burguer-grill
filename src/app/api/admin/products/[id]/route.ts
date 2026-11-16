import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { productSchema } from "@/lib/validators";
import { parseBadges } from "@/lib/utils";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  const { badges, imageUrl, ...rest } = parsed.data;
  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(badges !== undefined ? { badges: JSON.stringify(badges) } : {}),
      ...(imageUrl !== undefined ? { imageUrl: imageUrl === "" ? null : imageUrl } : {}),
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    product: { ...product, badges: parseBadges(product.badges) },
  });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.product.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
