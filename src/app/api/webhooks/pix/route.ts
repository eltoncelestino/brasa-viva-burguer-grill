import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pixWebhookSchema } from "@/lib/validators";
import { emitOrderUpdated, emitPaymentConfirmed } from "@/server/socket";

export async function POST(req: Request) {
  try {
    const secretHeader = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.PIX_WEBHOOK_SECRET;

    // Em produção (fora do modo mock), exige secret válido
    if (
      process.env.PAYMENT_PROVIDER !== "mock" &&
      expectedSecret &&
      secretHeader !== expectedSecret
    ) {
      return NextResponse.json({ error: "Assinatura de webhook inválida." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = pixWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de webhook inválido.", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { event, externalId, paidAt } = parsed.data;

    const payment = await prisma.payment.findUnique({
      where: { externalId },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Cobrança Pix não encontrada." }, { status: 404 });
    }

    if (event === "payment.paid") {
      if (payment.status === "PAID") {
        return NextResponse.json({ ok: true, status: "PAID", idempotent: true });
      }

      const confirmedAt = paidAt ? new Date(paidAt) : new Date();

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: confirmedAt,
        },
      });

      const updatedOrder = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: {
          items: { include: { addons: true } },
          table: true,
          deliveryZone: true,
          payment: true,
        },
      });

      emitPaymentConfirmed(payment.order.restaurantId, payment.orderId, {
        orderId: payment.orderId,
        status: "PAID",
        paidAt: confirmedAt.toISOString(),
      });

      if (updatedOrder) {
        emitOrderUpdated(payment.order.restaurantId, updatedOrder.id, updatedOrder);
      }

      return NextResponse.json({ ok: true, status: "PAID" });
    }

    const nextStatus = event === "payment.expired" ? "EXPIRED" : "FAILED";
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: nextStatus },
    });

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) {
    console.error("Erro no webhook Pix:", error);
    return NextResponse.json({ error: "Erro interno no webhook Pix." }, { status: 500 });
  }
}
