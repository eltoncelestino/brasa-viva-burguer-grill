import QRCode from "qrcode";
import type { CreatePixChargeInput, PaymentProvider, PixChargeResult } from "./types";

/**
 * Provedor Pix simulado para desenvolvimento e homologação rápida.
 * Gera QR Code válido e código Copia e Cola padrão EMV simulado.
 */
export class MockPixProvider implements PaymentProvider {
  readonly name = "mock";

  async createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult> {
    const expirationMinutes = input.expirationMinutes ?? 15;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    const externalId = `mock_pix_${input.orderId}_${Date.now()}`;
    const amountFormatted = (input.amountCents / 100).toFixed(2);

    const pixCopyPaste = [
      "000201",
      "26580014BR.GOV.BCB.PIX0136brasa-viva-aldeota@fortaleza.ce.br",
      "52040000",
      "5303986",
      `540${amountFormatted.length}${amountFormatted}`,
      "5802BR",
      "5924BRASA VIVA BURGER GRILL",
      "6009FORTALEZA",
      `62140510PEDIDO${String(input.orderNumber).padStart(4, "0")}`,
      "6304MOCK",
    ].join("");

    const pixQrCode = await QRCode.toDataURL(pixCopyPaste, {
      width: 320,
      margin: 2,
      color: {
        dark: "#18181b",
        light: "#ffffff",
      },
    });

    return {
      externalId,
      pixQrCode,
      pixCopyPaste,
      expiresAt,
      provider: this.name,
    };
  }
}
