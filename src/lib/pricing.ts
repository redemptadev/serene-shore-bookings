import type { ExtraFee, PricingRule, Property, Quote } from "@/types";

interface PriceableProperty {
  base_price: number;
  weekend_price: number | null;
  cleaning_fee: number;
  extra_fees: unknown;
}

export function parseExtraFees(value: unknown): ExtraFee[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return { label: String(record?.["label"] ?? "Fee"), amount: Number(record?.["amount"] ?? 0) };
    })
    .filter((fee) => Number.isFinite(fee.amount) && fee.amount !== 0);
}

function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const cursor = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  while (cursor < end) {
    nights.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

/** Deterministic price engine shared by the UI and the server (server value wins). */
export function buildQuote(
  property: PriceableProperty,
  rules: Pick<PricingRule, "start_date" | "end_date" | "nightly_price" | "discount_percent">[],
  checkIn: string,
  checkOut: string,
  currency = "KES",
): Quote {
  const nights = eachNight(checkIn, checkOut);
  const nightlyBreakdown = nights.map((date) => {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const isWeekend = dow === 5 || dow === 6;
    let price = isWeekend && property.weekend_price ? Number(property.weekend_price) : Number(property.base_price);
    const rule = rules.find((r) => date >= r.start_date && date <= r.end_date);
    if (rule) {
      if (rule.nightly_price != null) price = Number(rule.nightly_price);
      if (rule.discount_percent) price = price * (1 - Number(rule.discount_percent) / 100);
    }
    return { date, price: Math.round(price) };
  });

  const subtotal = nightlyBreakdown.reduce((sum, night) => sum + night.price, 0);
  const cleaningFee = Number(property.cleaning_fee ?? 0);
  const extraFees = parseExtraFees(property.extra_fees);
  const fees = cleaningFee + extraFees.reduce((sum, fee) => sum + fee.amount, 0);

  return {
    nights: nightlyBreakdown.length,
    nightlyBreakdown,
    subtotal,
    cleaningFee,
    extraFees,
    fees,
    total: subtotal + fees,
    currency,
  };
}

export function fromNightly(property: Property) {
  return Number(property.base_price ?? 0);
}
