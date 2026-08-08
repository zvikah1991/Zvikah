import { useState } from "react";
import type { Product } from "../types";
import { formatPrice, unitSuffix } from "../lib/format";
import { ProductImage } from "./ui/ProductImage";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { CheckIcon, MinusIcon, PlusIcon } from "./ui/Icons";
import { useCart } from "../hooks/useCart";

const tagConfig = {
  new: { label: "חדש", tone: "brand" as const },
  popular: { label: "הכי נמכר", tone: "accent" as const },
  sale: { label: "מבצע", tone: "danger" as const },
  premium: { label: "פרימיום", tone: "neutral" as const },
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const step = product.unit === "kg" ? 0.5 : 1;

  const handleAdd = () => {
    addItem(product.id, quantity);
    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(11,36,54,0.25)]">
      <div className="relative aspect-[4/3]">
        <ProductImage categoryId={product.categoryId} className="h-full w-full" />
        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
            {product.tags.map((tag) => (
              <Badge key={tag} tone={tagConfig[tag].tone}>
                {tagConfig[tag].label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{product.name}</h3>
          <p className="mt-1 text-sm leading-snug text-[var(--text-muted)]">{product.description}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            {product.originalPrice && (
              <div className="text-xs font-medium text-[var(--text-muted)] line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[var(--brand)]">{formatPrice(product.price)}</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">{unitSuffix(product.unit)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[var(--border-strong)]">
            <button
              type="button"
              aria-label="הפחת כמות"
              onClick={() => setQuantity((q) => Math.max(step, +(q - step).toFixed(2)))}
              className="flex h-9 w-9 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--brand)]"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-9 text-center text-sm font-semibold tabular-nums">
              {quantity}
              {product.unit === "kg" ? "" : ""}
            </span>
            <button
              type="button"
              aria-label="הוסף כמות"
              onClick={() => setQuantity((q) => +(q + step).toFixed(2))}
              className="flex h-9 w-9 items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--brand)]"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant={justAdded ? "outline" : "primary"} size="sm" className="flex-1" onClick={handleAdd}>
            {justAdded ? (
              <>
                <CheckIcon className="h-4 w-4 text-[var(--success)]" />
                נוסף לעגלה
              </>
            ) : (
              "הוסף לעגלה"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
