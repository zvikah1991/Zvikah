import type { CartItemView } from "../hooks/useCart";
import type { CustomerDetails } from "../types";

/**
 * חיבור לסליקה מול קארדקום (Cardcom).
 *
 * חשוב: את הסליקה בפועל אי אפשר לבצע רק מהדפדפן (frontend) - כי זה
 * ידרוש לחשוף בקוד הציבורי את סיסמת ה-API הסודית של קארדקום, וזה מסוכן
 * ומאפשר לכל אחד לגנוב אותה ולחייב כרטיסים על חשבונכם.
 *
 * הפתרון (סטנדרטי בענף): שרת קטן (Serverless Function / Node) ששומר את
 * הסיסמה בצד השרת בלבד, פונה ל-API של קארדקום (CreateLowProfile), ומחזיר
 * לדפדפן קישור מאובטח לדף הסליקה של קארדקום. דוגמת שרת מוכנה נמצאת ב:
 * fish-store/server/cardcom-create-payment.example.ts
 *
 * כדי להפעיל בפועל:
 * 1. פתחו חשבון סליקה בקארדקום וקבלו TerminalNumber + API Name + API Password.
 * 2. פרסו את פונקציית השרת לדוגמה (Vercel / Netlify / כל שרת Node) עם
 *    המפתחות כמשתני סביבה סודיים (לעולם לא ב-VITE_... כי אלו נחשפים ללקוח).
 * 3. עדכנו כאן את CARDCOM_ENDPOINT לכתובת השרת שפרסתם.
 */

const CARDCOM_ENDPOINT = import.meta.env.VITE_PAYMENT_API_URL ?? "/api/cardcom/create-payment";

export interface CheckoutOrder {
  items: CartItemView[];
  subtotal: number;
  customer: CustomerDetails;
}

export interface CardcomCreatePaymentResponse {
  ok: boolean;
  paymentUrl?: string;
  error?: string;
  /** "no-backend": payment server isn't deployed/reachable yet - not a real payment rejection. */
  code?: "no-backend" | "rejected";
}

export async function startCardcomPayment(order: CheckoutOrder): Promise<CardcomCreatePaymentResponse> {
  try {
    const response = await fetch(CARDCOM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    // A static site with no payment backend deployed yet will 404/405 on this route -
    // that's expected until the Cardcom server function (see README) is deployed.
    if (response.status === 404 || response.status === 405) {
      return {
        ok: false,
        code: "no-backend",
        error: "שרת הסליקה עדיין לא מחובר. יש להפעיל את פונקציית השרת של קארדקום (ראו README).",
      };
    }

    if (!response.ok) {
      return { ok: false, code: "rejected", error: `שגיאת שרת (${response.status})` };
    }

    const data = (await response.json()) as { url?: string; error?: string };
    if (!data.url) {
      return { ok: false, code: "rejected", error: data.error ?? "לא התקבל קישור לתשלום" };
    }

    return { ok: true, paymentUrl: data.url };
  } catch {
    return {
      ok: false,
      code: "no-backend",
      error: "שרת הסליקה עדיין לא מחובר. יש להפעיל את פונקציית השרת של קארדקום (ראו README).",
    };
  }
}
