import { useCart } from "../../hooks/useCart";
import { formatPrice, unitSuffix } from "../../lib/format";
import { Button } from "../ui/Button";
import { CartIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "../ui/Icons";

export function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const { items, subtotal, isOpen, close, setQuantity, removeItem } = useCart();

  return (
    <>
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-[var(--surface)] shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="עגלת קניות"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display flex items-center gap-2 text-lg font-bold">
            <CartIcon className="h-5 w-5" />
            העגלה שלי
          </h2>
          <button onClick={close} aria-label="סגירה" className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <CartIcon className="h-10 w-10 text-[var(--text-muted)]" />
              <p className="font-medium text-[var(--text-secondary)]">העגלה שלך ריקה</p>
              <p className="text-sm text-[var(--text-muted)]">הוסיפו דגים טעימים מהמחירון כדי להתחיל</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 px-5 py-4 animate-fade-up">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label="הסר מהעגלה"
                        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--danger)]"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatPrice(item.price)}
                      {unitSuffix(item.unit as "kg" | "unit" | "tray")}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-[var(--border-strong)]">
                        <button
                          onClick={() => setQuantity(item.productId, +(item.quantity - (item.unit === "kg" ? 0.5 : 1)).toFixed(2))}
                          className="flex h-7 w-7 items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand)]"
                          aria-label="הפחת כמות"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="min-w-8 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.productId, +(item.quantity + (item.unit === "kg" ? 0.5 : 1)).toFixed(2))}
                          className="flex h-7 w-7 items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand)]"
                          aria-label="הוסף כמות"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[var(--brand)] tabular-nums">{formatPrice(item.lineTotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--border)] px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-[var(--text-secondary)]">
              <span>סה"כ לתשלום</span>
              <span className="text-lg font-extrabold text-[var(--text-primary)] tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                close();
                onCheckout();
              }}
            >
              המשך לתשלום
            </Button>
            <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              המחיר הסופי (כולל משלוח) יוצג בעמוד התשלום
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
