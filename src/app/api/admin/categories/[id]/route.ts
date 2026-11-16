import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { categorySchema } from "@/lib/validators";

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
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const existing = await prisma.category.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json({ category });
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
  const existing = await prisma.category.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  await prisma.category.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
