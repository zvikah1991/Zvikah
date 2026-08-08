import { Logo } from "./Logo";
import { PhoneIcon, ShieldIcon } from "./ui/Icons";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            עסק משפחתי המתמחה בדגים טריים ופירות ים, באיכות ובטריות ללא פשרות - כבר שנים בשירות הלקוחות שלנו.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">יצירת קשר</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-secondary)]">
            <li className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-[var(--brand)]" />
              <a href="tel:0500000000" className="hover:text-[var(--brand)]">050-000-0000</a>
            </li>
            <li>כתובת החנות: רחוב הדוגמה 1, העיר</li>
            <li>ימים א'-ה' 08:00-19:00, ו' 07:00-14:00</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">תשלום מאובטח</h4>
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <ShieldIcon className="h-5 w-5 text-[var(--success)]" />
            סליקה מאובטחת באמצעות קארדקום
          </div>
          <div className="mt-3 flex gap-2">
            {["VISA", "Mastercard", "ISRACARD"].map((brand) => (
              <span
                key={brand}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-muted)]"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-5 text-center text-xs text-[var(--text-muted)] sm:px-6">
        המחירים באתר הם לדוגמה בלבד לצורך תצוגה, ויתעדכנו למחירון הרשמי © {new Date().getFullYear()} ויוסי דגים. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
