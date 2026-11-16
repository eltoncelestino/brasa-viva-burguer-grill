"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Printer,
  ArrowRight,
  Clock,
  MapPin,
  UtensilsCrossed,
  Store,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getClientSocket } from "@/lib/socket-client";
import { playNewOrderSound } from "@/lib/sound";
import { formatCurrency, formatTimeAgo, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface AdminOrder {
  id: string;
  orderNumber: number;
  type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
  status: "NEW" | "PREPARING" | "READY" | "FINISHED" | "CANCELLED";
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  notes: string | null;
  totalCents: number;
  createdAt: string;
  table: { number: number } | null;
  deliveryZone: { neighborhood: string } | null;
  payment: { method: string; status: string } | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    notes: string | null;
    addons: Array<{ id: string; addonName: string }>;
  }>;
}

interface KanbanBoardProps {
  restaurantId: string;
  initialOrders: AdminOrder[];
}

const COLUMNS: Array<{
  status: AdminOrder["status"];
  title: string;
  accent: string;
  nextStatus?: AdminOrder["status"];
  nextLabel?: string;
}> = [
  {
    status: "NEW",
    title: "Novo",
    accent: "border-t-orange-500",
    nextStatus: "PREPARING",
    nextLabel: "Iniciar Preparo",
  },
  {
    status: "PREPARING",
    title: "Em preparo",
    accent: "border-t-amber-500",
    nextStatus: "READY",
    nextLabel: "Marcar Pronto",
  },
  {
    status: "READY",
    title: "Pronto",
    accent: "border-t-emerald-500",
    nextStatus: "FINISHED",
    nextLabel: "Finalizar",
  },
  {
    status: "FINISHED",
    title: "Finalizado",
    accent: "border-t-zinc-400",
  },
];

export function KanbanBoard({ restaurantId, initialOrders }: KanbanBoardProps) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const socket = getClientSocket();
    socket.emit("join:restaurant", restaurantId);

    const onOrderCreated = (newOrder: AdminOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
      if (soundEnabled) {
        playNewOrderSound();
      }
      toast.success(`Novo pedido #${newOrder.orderNumber} de ${newOrder.customerName}!`, {
        duration: 6000,
      });
    };

    const onOrderUpdated = (updated: AdminOrder) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    };

    const onPaymentConfirmed = (payload: { orderId: string; status: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.orderId && o.payment
            ? { ...o, payment: { ...o.payment, status: payload.status } }
            : o
        )
      );
      toast.info("Pagamento Pix confirmado em um pedido!");
    };

    socket.on("order:created", onOrderCreated);
    socket.on("order:updated", onOrderUpdated);
    socket.on("payment:confirmed", onPaymentConfirmed);

    return () => {
      socket.emit("leave:restaurant", restaurantId);
      socket.off("order:created", onOrderCreated);
      socket.off("order:updated", onOrderUpdated);
      socket.off("payment:confirmed", onPaymentConfirmed);
    };
  }, [restaurantId, soundEnabled]);

  const handleTransition = async (orderId: string, nextStatus: AdminOrder["status"]) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível atualizar o status.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch {
      toast.error("Erro de conexão ao atualizar pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Pedidos em Tempo Real
          </h1>
          <p className="text-sm text-zinc-500">
            Acompanhe e movimente os pedidos da cozinha automaticamente via WebSocket.
          </p>
        </div>

        <Button
          type="button"
          variant={soundEnabled ? "default" : "outline"}
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playNewOrderSound();
          }}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="h-4 w-4" />
              Alerta Sonoro Ativo
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              Som Desativado
            </>
          )}
        </Button>
      </div>

      {/* Grid Kanban */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className={cn(
                "flex min-h-[520px] flex-col rounded-2xl border border-zinc-200 border-t-4 bg-zinc-50/80 p-3.5",
                col.accent
              )}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-zinc-800">
                  {col.title}
                </h2>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-200 px-2 text-xs font-bold text-zinc-800">
                  {colOrders.length}
                </span>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {colOrders.map((order) => (
                    <motion.article
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-zinc-900">
                              #{order.orderNumber}
                            </span>
                            {order.payment?.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                Pago
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                {order.payment?.method === "PIX" ? "Pix Pendente" : "Na Entrega"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-zinc-700">
                            {order.customerName}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(order.createdAt)}
                        </span>
                      </div>

                      {/* Tipo do Pedido */}
                      <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700">
                        {order.type === "DELIVERY" && (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span className="truncate">
                              Entrega • {order.deliveryZone?.neighborhood}
                            </span>
                          </>
                        )}
                        {order.type === "DINE_IN" && (
                          <>
                            <UtensilsCrossed className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>Mesa {order.table?.number}</span>
                          </>
                        )}
                        {order.type === "TAKEOUT" && (
                          <>
                            <Store className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                            <span>Retirada no Balcão</span>
                          </>
                        )}
                      </div>

                      {/* Itens */}
                      <ul className="space-y-1.5 border-t border-zinc-100 pt-2 text-xs">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-zinc-700">
                            <span className="font-bold text-zinc-900">
                              {item.quantity}x
                            </span>{" "}
                            {item.productName}
                            {item.variantName ? ` (${item.variantName})` : ""}
                            {item.addons.length > 0 && (
                              <p className="pl-4 text-[11px] text-zinc-500">
                                + {item.addons.map((a) => a.addonName).join(", ")}
                              </p>
                            )}
                            {item.notes && (
                              <p className="mt-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800">
                                Obs: {item.notes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>

                      {order.notes && (
                        <p className="rounded-lg bg-amber-50 p-2 text-[11px] font-medium text-amber-900">
                          Obs geral: {order.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
                        <span className="text-sm font-extrabold text-zinc-900">
                          {formatCurrency(order.totalCents)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/pedidos/${order.id}/imprimir`}
                            target="_blank"
                            title="Imprimir comanda 80mm"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>

                          {order.status !== "FINISHED" && (
                            <button
                              type="button"
                              title="Cancelar pedido"
                              disabled={updatingId === order.id}
                              onClick={() => handleTransition(order.id, "CANCELLED")}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {col.nextStatus && (
                            <Button
                              type="button"
                              size="sm"
                              disabled={updatingId === order.id}
                              onClick={() => handleTransition(order.id, col.nextStatus!)}
                            >
                              {col.nextLabel}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
