"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThermalReceiptProps {
  order: {
    id: string;
    orderNumber: number;
    type: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string | null;
    notes: string | null;
    subtotalCents: number;
    deliveryFeeCents: number;
    totalCents: number;
    createdAt: string;
    restaurant: {
      name: string;
      address: string;
      phone: string;
    };
    table: { number: number } | null;
    deliveryZone: { neighborhood: string } | null;
    payment: { method: string; status: string } | null;
    items: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      quantity: number;
      unitPriceCents: number;
      totalPriceCents: number;
      notes: string | null;
      addons: Array<{ id: string; addonName: string; priceCents: number }>;
    }>;
  };
}

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "PIX",
  CARD_ON_DELIVERY: "CARTÃO NA ENTREGA",
  CASH: "DINHEIRO",
};

const TYPE_LABEL: Record<string, string> = {
  DINE_IN: "CONSUMO NA MESA",
  TAKEOUT: "RETIRADA NO BALCÃO",
  DELIVERY: "DELIVERY",
};

export function ThermalReceipt({ order }: ThermalReceiptProps) {
  return (
    <div className="min-h-screen bg-zinc-200 py-8 print:bg-white print:py-0">
      {/* Barra de ações (oculta na impressão) */}
      <div className="no-print mx-auto mb-6 flex max-w-md items-center justify-between px-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Kanban
        </Link>
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir Comanda (80mm)
        </Button>
      </div>

      {/* Cupom Térmico 80mm */}
      <article className="thermal-receipt mx-auto w-[80mm] bg-white p-4 font-mono text-[12px] leading-snug text-black shadow-lg">
        <header className="border-b border-dashed border-black pb-2 text-center">
          <h1 className="text-sm font-bold uppercase">{order.restaurant.name}</h1>
          <p className="text-[10px]">{order.restaurant.address}</p>
          <p className="text-[10px]">Tel: {order.restaurant.phone}</p>
        </header>

        <section className="border-b border-dashed border-black py-2 text-center">
          <p className="text-base font-bold">PEDIDO #{order.orderNumber}</p>
          <p className="font-bold">{TYPE_LABEL[order.type] ?? order.type}</p>
          {order.table && <p className="text-sm font-bold">MESA: {order.table.number}</p>}
          <p className="text-[10px]">{formatDateTime(order.createdAt)}</p>
        </section>

        <section className="border-b border-dashed border-black py-2 space-y-0.5">
          <p>
            <strong>Cliente:</strong> {order.customerName}
          </p>
          <p>
            <strong>Tel:</strong> {order.customerPhone}
          </p>
          {order.deliveryZone && (
            <p>
              <strong>Bairro:</strong> {order.deliveryZone.neighborhood}
            </p>
          )}
          {order.deliveryAddress && (
            <p>
              <strong>End:</strong> {order.deliveryAddress}
            </p>
          )}
        </section>

        <section className="border-b border-dashed border-black py-2">
          <p className="mb-1 font-bold uppercase">Itens do Pedido</p>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id}>
                <div className="flex justify-between font-bold">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <span>{formatCurrency(item.totalPriceCents)}</span>
                </div>
                {item.variantName && (
                  <p className="pl-3 text-[11px]">• {item.variantName}</p>
                )}
                {item.addons.map((addon) => (
                  <p key={addon.id} className="pl-3 text-[11px]">
                    + {addon.addonName} ({formatCurrency(addon.priceCents)})
                  </p>
                ))}
                {item.notes && (
                  <p className="pl-3 text-[11px] font-bold">OBS: {item.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {order.notes && (
          <section className="border-b border-dashed border-black py-2">
            <p className="font-bold">OBS GERAL:</p>
            <p>{order.notes}</p>
          </section>
        )}

        <section className="border-b border-dashed border-black py-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotalCents)}</span>
          </div>
          {order.deliveryFeeCents > 0 && (
            <div className="flex justify-between">
              <span>Taxa Entrega:</span>
              <span>{formatCurrency(order.deliveryFeeCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL:</span>
            <span>{formatCurrency(order.totalCents)}</span>
          </div>
          <div className="flex justify-between pt-1 text-[11px]">
            <span>Pagamento:</span>
            <span className="font-bold">
              {PAYMENT_LABEL[order.payment?.method ?? "PIX"] ?? "PIX"} (
              {order.payment?.status === "PAID" ? "PAGO" : "PENDENTE"})
            </span>
          </div>
        </section>

        <footer className="pt-3 text-center text-[10px]">
          <p>Obrigado pela preferência!</p>
          <p>Brasa Viva Burger & Grill • Fortaleza-CE</p>
        </footer>
      </article>
    </div>
  );
}
