import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createBooking, getBookingQuote } from "@/lib/bookings.functions";
import { checkAvailability } from "@/services/properties";
import { formatMoney, nightsBetween, toDateInput } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import type { PropertyListItem, Quote } from "@/types";

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function BookingWidget({ property, currency = "KES" }: { property: PropertyListItem; currency?: string }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const quoteFn = useServerFn(getBookingQuote);
  const bookFn = useServerFn(createBooking);

  const today = useMemo(() => toDateInput(new Date()), []);
  const [checkIn, setCheckIn] = useState(toDateInput(addDays(new Date(), 1)));
  const [checkOut, setCheckOut] = useState(toDateInput(addDays(new Date(), 1 + Math.max(1, property.min_nights))));
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pricing, setPricing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setName((current) => current || profile?.full_name || "");
    setEmail((current) => current || profile?.email || user?.email || "");
    setPhone((current) => current || profile?.phone || "");
  }, [profile, user]);

  const nights = nightsBetween(checkIn, checkOut);

  useEffect(() => {
    let active = true;
    if (nights < 1) {
      setQuote(null);
      setMessage("Choose a check-out date after check-in.");
      return;
    }
    setPricing(true);
    setMessage(null);
    (async () => {
      try {
        const [result, isAvailable] = await Promise.all([
          quoteFn({ data: { propertyId: property.id, checkIn, checkOut } }),
          checkAvailability(property.id, checkIn, checkOut),
        ]);
        if (!active) return;
        setAvailable(isAvailable);
        if (result.ok) setQuote(result.quote);
        else {
          setQuote(null);
          setMessage(result.message);
        }
      } catch {
        if (active) setMessage("We couldn't price these dates. Please try again.");
      } finally {
        if (active) setPricing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [checkIn, checkOut, nights, property.id, quoteFn]);

  async function submit() {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/stays/${property.slug}` } });
      return;
    }
    if (!quote || available === false) return;
    setSubmitting(true);
    try {
      const result = await bookFn({
        data: {
          propertyId: property.id,
          checkIn,
          checkOut,
          guests,
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestPhone: phone.trim(),
          guestNotes: notes.trim(),
        },
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Booking held — complete payment to confirm.");
      navigate({ to: "/dashboard/bookings/$id", params: { id: result.booking.id } });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !!quote && available !== false && nights >= 1 && name.trim().length > 1 && /.+@.+\..+/.test(email) && !submitting;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold">{formatMoney(Number(property.base_price), currency)}</p>
        <span className="text-sm text-muted-foreground">per night</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="check-in">Check in</Label>
          <Input
            id="check-in"
            type="date"
            min={today}
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="check-out">Check out</Label>
          <Input
            id="check-out"
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-1.5">
        <Label htmlFor="guests">Guests</Label>
        <Input
          id="guests"
          type="number"
          min={1}
          max={property.max_guests}
          value={guests}
          onChange={(event) => setGuests(Math.min(property.max_guests, Math.max(1, Number(event.target.value) || 1)))}
        />
        <p className="text-xs text-muted-foreground">
          Up to {property.max_guests} guests · minimum {property.min_nights} night(s)
        </p>
      </div>

      {available === false && (
        <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          These dates are already taken. Try different dates.
        </p>
      )}
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}

      {quote && available !== false && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {quote.nights} night(s) × avg {formatMoney(quote.subtotal / Math.max(1, quote.nights), quote.currency)}
            </span>
            <span>{formatMoney(quote.subtotal, quote.currency)}</span>
          </div>
          {quote.cleaningFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cleaning fee</span>
              <span>{formatMoney(quote.cleaningFee, quote.currency)}</span>
            </div>
          )}
          {quote.extraFees.map((fee) => (
            <div key={fee.label} className="flex justify-between">
              <span className="text-muted-foreground">{fee.label}</span>
              <span>{formatMoney(fee.amount, quote.currency)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(quote.total, quote.currency)}</span>
          </div>
        </div>
      )}

      {user && (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="guest-name">Full name</Label>
            <Input id="guest-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-email">Email</Label>
            <Input id="guest-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-phone">Phone (for M-Pesa)</Label>
            <Input id="guest-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-notes">Notes for the host (optional)</Label>
            <Textarea id="guest-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
        </div>
      )}

      <Button className="mt-5 w-full" size="lg" disabled={user ? !canSubmit : false} onClick={submit}>
        {submitting || pricing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
        {user ? "Request booking" : "Sign in to book"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Dates are held once requested. Payment confirms your stay.
      </p>
    </div>
  );
}