import { Badge } from "@/components/ui/badge";
import type { BookingStatus, PaymentStatus } from "@/types";

const BOOKING: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-accent/20 text-accent-foreground" },
  confirmed: { label: "Confirmed", className: "bg-primary/15 text-primary" },
  cancelled: { label: "Cancelled", className: "bg-destructive/15 text-destructive" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
};

const PAYMENT: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Payment pending", className: "bg-accent/20 text-accent-foreground" },
  paid: { label: "Paid", className: "bg-primary/15 text-primary" },
  failed: { label: "Payment failed", className: "bg-destructive/15 text-destructive" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const item = BOOKING[status];
  return <Badge variant="secondary" className={item.className}>{item.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const item = PAYMENT[status];
  return <Badge variant="secondary" className={item.className}>{item.label}</Badge>;
}
