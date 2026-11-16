import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";

const createTableSchema = z.object({
  number: z.number().int().min(1).max(500),
  label: z.string().trim().max(60).optional(),
  seats: z.number().int().min(1).max(30).default(4),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const tables = await prisma.table.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { number: "asc" },
  });

  return NextResponse.json({ tables });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados de mesa inválidos." },
      { status: 400 }
    );
  }

  const exists = await prisma.table.findUnique({
    where: {
      restaurantId_number: {
        restaurantId: session.user.restaurantId,
        number: parsed.data.number,
      },
    },
  });

  if (exists) {
    return NextResponse.json(
      { error: `A Mesa ${parsed.data.number} já está cadastrada.` },
      { status: 409 }
    );
  }

  const table = await prisma.table.create({
    data: {
      number: parsed.data.number,
      label: parsed.data.label || `Mesa ${parsed.data.number}`,
      seats: parsed.data.seats,
      restaurantId: session.user.restaurantId,
    },
  });

  return NextResponse.json({ table }, { status: 201 });
}
