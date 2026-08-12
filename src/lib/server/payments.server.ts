import { mpesaConfigured, stkPush } from "./mpesa.server";

export type PaymentProviderId = "mpesa" | "card";

export interface InitiateInput {
  bookingId: string;
  reference: string;
  amount: number;
  currency: string;
  phone?: string | null;
  email?: string | null;
  description: string;
}

export interface InitiateResult {
  status: "initiated" | "unavailable";
  provider: PaymentProviderId;
  message: string;
  checkoutRequestId?: string;
  redirectUrl?: string;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  isConfigured(): boolean;
  initiate(input: InitiateInput): Promise<InitiateResult>;
}

const mpesa: PaymentProvider = {
  id: "mpesa",
  label: "M-Pesa (STK Push)",
  isConfigured: mpesaConfigured,
  async initiate(input) {
    if (!input.phone) throw new Error("A phone number is required for M-Pesa payments.");
    const push = await stkPush({
      phone: input.phone,
      amount: input.amount,
      reference: input.reference,
      description: input.description,
    });
    return {
      status: "initiated",
      provider: "mpesa",
      message: push.customerMessage,
      checkoutRequestId: push.checkoutRequestId,
    };
  },
};

const card: PaymentProvider = {
  id: "card",
  label: "Card payment",
  isConfigured: () => Boolean(process.env["CARD_PAYMENT_API_KEY"] && process.env["CARD_PAYMENT_PUBLIC_KEY"]),
  async initiate() {
    throw new Error("Card payments are not configured yet. Add card provider credentials in Settings → Integrations.");
  },
};

export const PAYMENT_PROVIDERS: PaymentProvider[] = [mpesa, card];

export function getProvider(id: PaymentProviderId): PaymentProvider {
  const provider = PAYMENT_PROVIDERS.find((candidate) => candidate.id === id);
  if (!provider) throw new Error(`Unknown payment provider: ${id}`);
  return provider;
}
