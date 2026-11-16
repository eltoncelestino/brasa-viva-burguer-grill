import type { CreatePixChargeInput, PaymentProvider, PixChargeResult } from "./types";

/**
 * Adapter para integração real com a API de Pix do Mercado Pago.
 * Requer MERCADOPAGO_ACCESS_TOKEN configurado no ambiente.
 */
export class MercadoPagoPixProvider implements PaymentProvider {
  readonly name = "mercadopago";

  constructor(private readonly accessToken: string) {
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    }
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult> {
    const expirationMinutes = input.expirationMinutes ?? 15;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `order-${input.orderId}`,
      },
      body: JSON.stringify({
        transaction_amount: Number((input.amountCents / 100).toFixed(2)),
        description: input.description,
        payment_method_id: "pix",
        date_of_expiration: expiresAt.toISOString(),
        payer: {
          first_name: input.customerName,
          email: `cliente+${input.orderNumber}@brasaviva.com.br`,
        },
        external_reference: input.orderId,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Falha ao criar cobrança Pix no Mercado Pago: ${errText}`);
    }

    const data = (await response.json()) as {
      id: number;
      point_of_interaction?: {
        transaction_data?: {
          qr_code?: string;
          qr_code_base64?: string;
        };
      };
    };

    const txData = data.point_of_interaction?.transaction_data;
    if (!txData?.qr_code || !txData?.qr_code_base64) {
      throw new Error("Resposta do Mercado Pago sem dados de QR Code Pix.");
    }

    return {
      externalId: String(data.id),
      pixQrCode: `data:image/png;base64,${txData.qr_code_base64}`,
      pixCopyPaste: txData.qr_code,
      expiresAt,
      provider: this.name,
    };
  }
}
