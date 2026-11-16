"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Copy,
  ChefHat,
  PackageCheck,
  Flame,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getClientSocket } from "@/lib/socket-client";
import { formatCurrency, cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/order-rules";
import { Button } from "@/components/ui/button";

interface OrderTrackingProps {
  initialOrder: {
    id: string;
    orderNumber: number;
    type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
    status: "NEW" | "PREPARING" | "READY" | "FINISHED" | "CANCELLED";
    customerName: string;
    subtotalCents: number;
    deliveryFeeCents: number;
    totalCents: number;
    deliveryAddress: string | null;
    restaurant: {
      name: string;
      slug: string;
      address: string;
      phone: string;
    };
    table: { number: number } | null;
    deliveryZone: { neighborhood: string; estimatedMinutes: number } | null;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      quantity: number;
      totalPriceCents: number;
      addons: Array<{ id: string; addonName: string }>;
    }>;
    payment: {
      id: string;
      method: "PIX" | "CARD_ON_DELIVERY" | "CASH";
      status: "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED";
      provider: string;
      externalId: string | null;
      pixQrCode: string | null;
      pixCopyPaste: string | null;
      expiresAt: string | null;
      paidAt: string | null;
    } | null;
  };
}

const STEPS = [
  { status: "NEW", label: "Recebido", icon: Clock },
  { status: "PREPARING", label: "Na Brasa", icon: ChefHat },
  { status: "READY", label: "Pronto", icon: PackageCheck },
  { status: "FINISHED", label: "Entregue", icon: CheckCircle2 },
] as const;

export function OrderTrackingClient({ initialOrder }: OrderTrackingProps) {
  const [order, setOrder] = useState(initialOrder);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!initialOrder.payment?.expiresAt) return 0;
    return Math.max(
      0,
      Math.floor((new Date(initialOrder.payment.expiresAt).getTime() - Date.now()) / 1000)
    );
  });
  const [simulating, setSimulating] = useState(false);

  // Escuta ativa via Socket.IO para confirmação automática do Pix e status do pedido
  useEffect(() => {
    const socket = getClientSocket();
    socket.emit("join:order", order.id);

    const handlePaymentConfirmed = (payload: { orderId: string; status: string; paidAt: string }) => {
      if (payload.orderId !== order.id) return;
      setOrder((prev) => ({
        ...prev,
        payment: prev.payment
          ? { ...prev.payment, status: "PAID", paidAt: payload.paidAt }
          : null,
      }));
      toast.success("Pagamento Pix confirmado automaticamente!");
    };

    const handleOrderUpdated = (updated: Partial<typeof initialOrder>) => {
      if (updated.id && updated.id !== order.id) return;
      setOrder((prev) => ({
        ...prev,
        status: updated.status ?? prev.status,
        payment: updated.payment ?? prev.payment,
      }));
      if (updated.status) {
        toast.info(`Status atualizado: ${ORDER_STATUS_LABELS[updated.status]}`);
      }
    };

    socket.on("payment:confirmed", handlePaymentConfirmed);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("payment:confirmed", handlePaymentConfirmed);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [order.id]);

  // Timer de expiração do Pix
  useEffect(() => {
    if (order.payment?.status !== "PENDING" || !order.payment?.expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(order.payment!.expiresAt!).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [order.payment]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  const handleCopyPix = async () => {
    if (!order.payment?.pixCopyPaste) return;
    await navigator.clipboard.writeText(order.payment.pixCopyPaste);
    toast.success("Código Pix Copia e Cola copiado!");
  };

  const handleSimulatePix = async () => {
    if (!order.payment?.externalId) return;
    setSimulating(true);
    try {
      const res = await fetch("/api/webhooks/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "payment.paid",
          externalId: order.payment.externalId,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erro ao simular pagamento.");
      }
    } finally {
      setSimulating(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.status === order.status);
  const isPixPending =
    order.payment?.method === "PIX" && order.payment?.status === "PENDING";

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href={`/r/${order.restaurant.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao cardápio
        </Link>

        {/* Card Principal do Pedido */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
        >
          <div className="bg-zinc-950 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  {order.restaurant.name}
                </p>
                <h1 className="mt-0.5 text-2xl font-extrabold">
                  Pedido #{order.orderNumber}
                </h1>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600/20 text-orange-400">
                <Flame className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              Olá, <strong>{order.customerName}</strong>! Acompanhe em tempo real:
            </p>
          </div>

          {/* Stepper de Status */}
          <div className="border-b border-zinc-100 px-6 py-5">
            {order.status === "CANCELLED" ? (
              <div className="rounded-2xl bg-red-50 p-4 text-center text-sm font-bold text-red-700">
                Este pedido foi cancelado.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const active = idx <= currentStepIndex;
                  const current = idx === currentStepIndex;
                  return (
                    <div key={step.status} className="flex flex-col items-center text-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                          active
                            ? "border-orange-600 bg-orange-600 text-white"
                            : "border-zinc-200 bg-white text-zinc-400",
                          current && "ring-4 ring-orange-100"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs font-bold",
                          active ? "text-zinc-900" : "text-zinc-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bloco de Pagamento Pix */}
          {isPixPending && order.payment && (
            <div className="border-b border-zinc-100 bg-orange-50/40 p-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                <Clock className="h-3.5 w-3.5" />
                Aguardando pagamento Pix • Expira em {formatTimer(secondsLeft)}
              </div>

              {order.payment.pixQrCode && (
                <div className="mx-auto mt-4 w-fit rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs">
                  <img
                    src={order.payment.pixQrCode}
                    alt="QR Code Pix para pagamento"
                    className="h-52 w-52"
                  />
                </div>
              )}

              <p className="mt-3 text-lg font-extrabold text-zinc-900">
                {formatCurrency(order.totalCents)}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyPix}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4" />
                  Copiar código Pix
                </Button>

                {order.payment.provider === "mock" && (
                  <Button
                    type="button"
                    variant="success"
                    onClick={handleSimulatePix}
                    disabled={simulating}
                    className="flex-1"
                  >
                    {simulating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Simular Pagamento (Dev)
                  </Button>
                )}
              </div>
            </div>
          )}

          {order.payment?.status === "PAID" && (
            <div className="flex items-center gap-3 border-b border-zinc-100 bg-emerald-50 px-6 py-4 text-emerald-800">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold">Pagamento confirmado!</p>
                <p className="text-xs text-emerald-700">
                  Seu pedido já está na fila da nossa parrilla.
                </p>
              </div>
            </div>
          )}

          {/* Resumo dos Itens */}
          <div className="space-y-4 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
              Detalhes do Pedido
            </h2>
            <ul className="space-y-2.5 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {item.quantity}x {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-zinc-500">{item.variantName}</p>
                    )}
                    {item.addons.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        + {item.addons.map((a) => a.addonName).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-zinc-900">
                    {formatCurrency(item.totalPriceCents)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-zinc-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotalCents)}</span>
              </div>
              {order.deliveryFeeCents > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Entrega ({order.deliveryZone?.neighborhood})</span>
                  <span>{formatCurrency(order.deliveryFeeCents)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-extrabold text-zinc-900">
                <span>Total</span>
                <span className="text-orange-600">{formatCurrency(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
