import { useMemo, useState, type FormEvent } from "react";
import { useCart } from "../../hooks/useCart";
import { formatPrice, unitSuffix } from "../../lib/format";
import { startCardcomPayment } from "../../lib/cardcom";
import type { CustomerDetails } from "../../types";
import { Button } from "../ui/Button";
import { Logo } from "../Logo";
import { CheckIcon, PhoneIcon, ShieldIcon, TruckIcon } from "../ui/Icons";

const FREE_DELIVERY_THRESHOLD = 300;
const DELIVERY_FEE = 25;

const emptyCustomer: CustomerDetails = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  fulfillment: "delivery",
};

type SubmitState = "idle" | "submitting" | "backend-missing" | "error";

export function CheckoutPage({ onBack }: { onBack: () => void }) {
  const { items, subtotal, clear } = useCart();
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer);
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const deliveryFee = customer.fulfillment === "pickup" || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const isValid = useMemo(() => {
    if (!customer.fullName.trim() || !customer.phone.trim() || !customer.email.trim()) return false;
    if (customer.fulfillment === "delivery" && (!customer.address.trim() || !customer.city.trim())) return false;
    return items.length > 0;
  }, [customer, items.length]);

  function updateField<K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    setState("submitting");
    setErrorMessage("");

    const result = await startCardcomPayment({ items, subtotal: total, customer });

    if (result.ok && result.paymentUrl) {
      clear();
      window.location.href = result.paymentUrl;
      return;
    }

    if (result.code === "no-backend") {
      setState("backend-missing");
    } else {
      setState("error");
      setErrorMessage(result.error ?? "אירעה שגיאה, נסו שוב");
    }
  }

  if (items.length === 0 && state === "idle") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo />
        <p className="text-lg font-semibold text-[var(--text-primary)]">העגלה שלך ריקה</p>
        <Button onClick={onBack}>חזרה למחירון</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <button onClick={onBack} className="mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--brand)]">
        ← חזרה למחירון
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[var(--text-primary)]">השלמת הזמנה</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <fieldset className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <legend className="px-1 text-sm font-bold text-[var(--text-primary)]">אופן קבלת ההזמנה</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["delivery", "pickup"] as const).map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => updateField("fulfillment", option)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-sm font-semibold transition-colors ${
                      customer.fulfillment === option
                        ? "border-[var(--brand)] bg-[var(--surface-2)] text-[var(--brand)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <TruckIcon className="h-5 w-5" />
                    {option === "delivery" ? "משלוח עד הבית" : "איסוף עצמי מהחנות"}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <legend className="px-1 text-sm font-bold text-[var(--text-primary)]">פרטי התקשרות</legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="שם מלא" value={customer.fullName} onChange={(v) => updateField("fullName", v)} required />
                <Field label="טלפון" value={customer.phone} onChange={(v) => updateField("phone", v)} type="tel" required />
                <Field
                  label="אימייל"
                  value={customer.email}
                  onChange={(v) => updateField("email", v)}
                  type="email"
                  required
                  className="sm:col-span-2"
                />
                {customer.fulfillment === "delivery" && (
                  <>
                    <Field label="עיר" value={customer.city} onChange={(v) => updateField("city", v)} required />
                    <Field label="כתובת מלאה" value={customer.address} onChange={(v) => updateField("address", v)} required />
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">הערות להזמנה (לא חובה)</label>
                  <textarea
                    value={customer.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand)]"
                    placeholder="לדוגמה: לנקות ולפלט, להביא עד השעה 17:00..."
                  />
                </div>
              </div>
            </fieldset>

            {state === "backend-missing" && (
              <div className="rounded-2xl border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,white)] p-4 text-sm text-[var(--brand-dark)]">
                <p className="font-bold">חיבור הסליקה בקארדקום עדיין לא הופעל באתר</p>
                <p className="mt-1 leading-relaxed">
                  פרטי ההזמנה נשמרו. כדי לחייב כרטיס אשראי צריך לחבר את חשבון הסליקה בקארדקום (ראו fish-store/README.md).
                  בינתיים אפשר להשלים את ההזמנה בטלפון:
                </p>
                <a href="tel:0500000000" className="mt-3 inline-flex items-center gap-1.5 font-bold text-[var(--brand)]">
                  <PhoneIcon className="h-4 w-4" /> 050-000-0000
                </a>
              </div>
            )}

            {state === "error" && (
              <div className="rounded-2xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-medium text-[var(--danger)]">
                {errorMessage}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={!isValid || state === "submitting"}>
              {state === "submitting" ? "מעביר לתשלום מאובטח..." : `מעבר לתשלום מאובטח - ${formatPrice(total)}`}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[var(--text-muted)]">
              <ShieldIcon className="h-3.5 w-3.5" />
              התשלום מתבצע בעמוד מאובטח של קארדקום, פרטי האשראי אינם נשמרים באתר
            </p>
          </form>
        </div>

        <OrderSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
        {label} {required && <span className="text-[var(--danger)]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand)]"
      />
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  total,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="font-display text-base font-bold text-[var(--text-primary)]">סיכום הזמנה</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-[var(--text-secondary)]">
              {item.name} <span className="text-[var(--text-muted)]">× {item.quantity}{unitSuffix(item.unit as "kg" | "unit" | "tray")}</span>
            </span>
            <span className="font-semibold tabular-nums">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>סכום ביניים</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>משלוח</span>
          <span className="tabular-nums">{deliveryFee === 0 ? "חינם" : formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-base font-extrabold text-[var(--text-primary)]">
          <span>סה"כ לתשלום</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-[var(--success-bg)] px-3 py-2 text-xs font-semibold text-[var(--success)]">
        <CheckIcon className="h-3.5 w-3.5" />
        {subtotal >= FREE_DELIVERY_THRESHOLD ? "זכאים למשלוח חינם!" : `עוד ${formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} למשלוח חינם`}
      </div>
    </aside>
  );
}
