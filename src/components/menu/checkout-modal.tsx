"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  MapPin,
  Store,
  UtensilsCrossed,
  QrCode,
  CreditCard,
  Banknote,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { MenuDeliveryZone, MenuRestaurant } from "@/types/menu";
import {
  useCartStore,
  getCartSubtotalCents,
  getCartItemUnitPriceCents,
} from "@/stores/cart-store";
import { formatCurrency, formatPhone, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: MenuRestaurant;
  deliveryZones: MenuDeliveryZone[];
  initialTableNumber?: number | null;
}

type OrderType = "DINE_IN" | "TAKEOUT" | "DELIVERY";
type PaymentMethod = "PIX" | "CARD_ON_DELIVERY" | "CASH";

export function CheckoutModal({
  isOpen,
  onClose,
  restaurant,
  deliveryZones,
  initialTableNumber = null,
}: CheckoutModalProps) {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>(
    initialTableNumber ? "DINE_IN" : "DELIVERY"
  );
  const [tableNumber, setTableNumber] = useState<string>(
    initialTableNumber ? String(initialTableNumber) : "1"
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    deliveryZones[0]?.id ?? ""
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [submitting, setSubmitting] = useState(false);

  const subtotalCents = getCartSubtotalCents(items);
  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) ?? null;
  const deliveryFeeCents = orderType === "DELIVERY" ? (selectedZone?.feeCents ?? 0) : 0;
  const totalCents = subtotalCents + deliveryFeeCents;

  const handleNextStep1 = () => {
    if (customerName.trim().length < 2) {
      toast.error("Informe seu nome para continuar.");
      return;
    }
    const digits = customerPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Informe um telefone/WhatsApp válido com DDD.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (orderType === "DINE_IN") {
      const num = parseInt(tableNumber, 10);
      if (!num || num < 1) {
        toast.error("Informe o número da sua mesa.");
        return;
      }
    }
    if (orderType === "DELIVERY") {
      if (!selectedZoneId) {
        toast.error("Selecione o bairro de entrega em Fortaleza.");
        return;
      }
      if (deliveryAddress.trim().length < 8) {
        toast.error("Informe o endereço completo (rua, número e complemento).");
        return;
      }
    }
    setStep(3);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error("Sua sacola está vazia.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          type: orderType,
          customerName: customerName.trim(),
          customerPhone,
          tableNumber: orderType === "DINE_IN" ? parseInt(tableNumber, 10) : null,
          deliveryZoneId: orderType === "DELIVERY" ? selectedZoneId : null,
          deliveryAddress: orderType === "DELIVERY" ? deliveryAddress.trim() : null,
          notes: orderNotes.trim() || null,
          paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            addonOptionIds: item.addons.map((a) => a.id),
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível enviar seu pedido.");
        return;
      }

      clearCart();
      onClose();
      toast.success(`Pedido #${data.order.orderNumber} criado com sucesso!`);
      router.push(`/r/${restaurant.slug}/pedido/${data.order.id}`);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Finalizar pedido"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            {/* Header + Progresso */}
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">
                  Finalizar Pedido
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar checkout"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { n: 1, label: "Identificação" },
                  { n: 2, label: "Entrega / Mesa" },
                  { n: 3, label: "Resumo & Pix" },
                ].map((s) => (
                  <div key={s.n} className="space-y-1">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-colors",
                        step >= s.n ? "bg-orange-600" : "bg-zinc-200"
                      )}
                    />
                    <p
                      className={cn(
                        "text-[11px] font-semibold",
                        step >= s.n ? "text-orange-700" : "text-zinc-400"
                      )}
                    >
                      {s.n}. {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corpo do Step */}
            <div className="flex-1 overflow-y-auto p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-zinc-800">
                    <User className="h-5 w-5 text-orange-600" />
                    <h3 className="text-base font-bold">Quem está pedindo?</h3>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-name">Nome completo</Label>
                    <Input
                      id="checkout-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: João Victor Silva"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-phone">WhatsApp / Telefone</Label>
                    <Input
                      id="checkout-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      placeholder="(85) 99999-9999"
                    />
                    <p className="text-xs text-zinc-500">
                      Usaremos apenas para avisar sobre o andamento do seu pedido.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-zinc-900">
                    Como você quer receber?
                  </h3>

                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "DELIVERY" as const,
                        label: "Entrega",
                        icon: MapPin,
                      },
                      {
                        id: "TAKEOUT" as const,
                        label: "Retirada",
                        icon: Store,
                      },
                      {
                        id: "DINE_IN" as const,
                        label: "Na Mesa",
                        icon: UtensilsCrossed,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = orderType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setOrderType(opt.id)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition cursor-pointer",
                            active
                              ? "border-orange-600 bg-orange-50 text-orange-700 ring-1 ring-orange-600"
                              : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {orderType === "DINE_IN" && (
                    <div className="space-y-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <Label htmlFor="table-number">Número da Mesa</Label>
                      <Input
                        id="table-number"
                        type="number"
                        min={1}
                        max={100}
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                      />
                    </div>
                  )}

                  {orderType === "TAKEOUT" && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-zinc-700">
                      <p className="font-bold text-zinc-900">Retirada no Balcão</p>
                      <p className="mt-1 text-xs text-zinc-600">{restaurant.address}</p>
                      <p className="mt-1 text-xs font-semibold text-orange-700">
                        Tempo médio de preparo: 20 a 30 minutos
                      </p>
                    </div>
                  )}

                  {orderType === "DELIVERY" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Bairro em Fortaleza - CE</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {deliveryZones.map((zone) => {
                            const active = zone.id === selectedZoneId;
                            return (
                              <button
                                key={zone.id}
                                type="button"
                                onClick={() => setSelectedZoneId(zone.id)}
                                className={cn(
                                  "flex items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer",
                                  active
                                    ? "border-orange-600 bg-orange-50/70 ring-1 ring-orange-600"
                                    : "border-zinc-200 hover:border-zinc-300"
                                )}
                              >
                                <div>
                                  <p className="text-sm font-bold text-zinc-900">
                                    {zone.neighborhood}
                                  </p>
                                  <p className="text-[11px] text-zinc-500">
                                    ~{zone.estimatedMinutes} min
                                  </p>
                                </div>
                                <span className="text-xs font-extrabold text-orange-700">
                                  {formatCurrency(zone.feeCents)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="delivery-address">
                          Endereço completo (Rua, número, apto/referência)
                        </Label>
                        <Input
                          id="delivery-address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Ex: Rua Barbosa de Freitas, 1020 - Apto 301"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="order-notes">Observações gerais (opcional)</Label>
                    <Input
                      id="order-notes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ex: Interfone quebrado, ligar ao chegar..."
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-700">
                      Resumo do Pedido
                    </h3>
                    <ul className="mt-3 space-y-2 border-b border-zinc-200 pb-3 text-sm">
                      {items.map((item) => (
                        <li
                          key={item.cartItemId}
                          className="flex items-start justify-between gap-2"
                        >
                          <span className="text-zinc-700">
                            <strong className="text-zinc-900">{item.quantity}x</strong>{" "}
                            {item.productName}
                            {item.variantName ? ` (${item.variantName})` : ""}
                          </span>
                          <span className="font-semibold text-zinc-900">
                            {formatCurrency(getCartItemUnitPriceCents(item) * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between text-zinc-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotalCents)}</span>
                      </div>
                      {orderType === "DELIVERY" && (
                        <div className="flex justify-between text-zinc-600">
                          <span>Taxa de entrega ({selectedZone?.neighborhood})</span>
                          <span>{formatCurrency(deliveryFeeCents)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 text-base font-extrabold text-zinc-900">
                        <span>Total</span>
                        <span className="text-orange-600">{formatCurrency(totalCents)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label>Forma de Pagamento</Label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "PIX" as const,
                          title: "Pix Instantâneo (QR Code)",
                          subtitle: "Aprovação automática em segundos",
                          icon: QrCode,
                        },
                        {
                          id: "CARD_ON_DELIVERY" as const,
                          title: "Cartão na Entrega / Mesa",
                          subtitle: "Crédito, débito ou vale-refeição",
                          icon: CreditCard,
                        },
                        {
                          id: "CASH" as const,
                          title: "Dinheiro",
                          subtitle: "Pagamento presencial no recebimento",
                          icon: Banknote,
                        },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer",
                              active
                                ? "border-orange-600 bg-orange-50/70 ring-1 ring-orange-600"
                                : "border-zinc-200 hover:border-zinc-300"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  active ? "text-orange-600" : "text-zinc-500"
                                )}
                              />
                              <div>
                                <p className="text-sm font-bold text-zinc-900">{pm.title}</p>
                                <p className="text-xs text-zinc-500">{pm.subtitle}</p>
                              </div>
                            </div>
                            {active && <CheckCircle2 className="h-5 w-5 text-orange-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer de Navegação */}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-white p-4">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  disabled={submitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              {step === 1 && (
                <Button type="button" onClick={handleNextStep1} className="ml-auto">
                  Continuar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {step === 2 && (
                <Button type="button" onClick={handleNextStep2} className="ml-auto">
                  Revisar Pedido
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {step === 3 && (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando pedido...
                    </>
                  ) : (
                    `Confirmar Pedido • ${formatCurrency(totalCents)}`
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
