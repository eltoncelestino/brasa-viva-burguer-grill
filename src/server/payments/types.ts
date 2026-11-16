export interface CreatePixChargeInput {
  orderId: string;
  orderNumber: number;
  amountCents: number;
  customerName: string;
  description: string;
  expirationMinutes?: number;
}

export interface PixChargeResult {
  externalId: string;
  pixQrCode: string; // Data URL (base64 PNG)
  pixCopyPaste: string; // Código EMV Copia e Cola
  expiresAt: Date;
  provider: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPixCharge(input: CreatePixChargeInput): Promise<PixChargeResult>;
}
