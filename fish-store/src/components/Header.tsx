import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { CartIcon, PhoneIcon } from "./ui/Icons";
import { Button } from "./ui/Button";
import { useCart } from "../hooks/useCart";

const STORE_PHONE_DISPLAY = "050-000-0000";
const STORE_PHONE_HREF = "tel:0500000000";

export function Header() {
  const { itemCount, open } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-shadow ${
        scrolled ? "border-[var(--border)] bg-[var(--surface)]/95 shadow-sm backdrop-blur" : "border-transparent bg-[var(--surface)]/80 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="shrink-0">
          <Logo />
        </a>

        <a
          href={STORE_PHONE_HREF}
          className="hidden items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--brand)] sm:flex"
        >
          <PhoneIcon className="h-4 w-4" />
          {STORE_PHONE_DISPLAY}
        </a>

        <Button variant="primary" size="md" onClick={open} className="relative">
          <CartIcon className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">עגלה</span>
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-[var(--brand-dark)] shadow">
              {itemCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
