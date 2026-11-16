import { MercadoPagoPixProvider } from "./mercadopago-provider";
import { MockPixProvider } from "./mock-provider";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER ?? "mock";

  if (providerName === "mercadopago") {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
    return new MercadoPagoPixProvider(token);
  }

  return new MockPixProvider();
}

export * from "./types";
