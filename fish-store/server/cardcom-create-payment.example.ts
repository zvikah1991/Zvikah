/**
 * דוגמת שרת ליצירת עסקת סליקה מול קארדקום (Cardcom LowProfile API).
 *
 * זהו קובץ *לדוגמה* בלבד - הוא לא רץ אוטומטית ולא מחובר לחשבון קארדקום
 * אמיתי. כדי להפעיל סליקה בפועל:
 *
 * 1. הירשמו לחשבון סוחר בקארדקום וקבלו: מספר טרמינל (TerminalNumber),
 *    שם משתמש API (ApiName) וסיסמת API (ApiPassword).
 * 2. פרסו קובץ זה כפונקציית שרת (Vercel Serverless Function / Netlify
 *    Function / Express endpoint) - חשוב: PORT/URL זה חייב לרוץ בצד
 *    שרת בלבד, ולא בקוד שרץ בדפדפן.
 * 3. הגדירו את המפתחות כמשתני סביבה סודיים בשרת (לא ב-frontend):
 *      CARDCOM_TERMINAL_NUMBER
 *      CARDCOM_API_NAME
 *      CARDCOM_API_PASSWORD
 * 4. עדכנו בקובץ src/lib/cardcom.ts את הכתובת (VITE_PAYMENT_API_URL)
 *    לכתובת שבה פרסתם את הפונקציה הזו.
 *
 * שימו לב: שמות השדות המדויקים ב-API של קארדקום עשויים להשתנות -
 * יש לאמת מול התיעוד הרשמי והעדכני של קארדקום (Cardcom Developers /
 * מדריך LowProfile) לפני עלייה לפרודקשן, ולבצע עסקת בדיקה בסביבת
 * הבדיקות (Sandbox) של קארדקום לפני חיבור כרטיסים אמיתיים.
 */

interface CheckoutRequestBody {
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    fulfillment: "delivery" | "pickup";
  };
}

const CARDCOM_API_BASE = "https://secure.cardcom.solutions/api/v11";

export async function handleCreatePayment(body: CheckoutRequestBody): Promise<{ url?: string; error?: string }> {
  const terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
  const apiName = process.env.CARDCOM_API_NAME;
  const apiPassword = process.env.CARDCOM_API_PASSWORD;

  if (!terminalNumber || !apiName || !apiPassword) {
    return { error: "חסרים פרטי חיבור לקארדקום בהגדרות השרת (משתני סביבה)" };
  }

  const siteUrl = process.env.SITE_URL ?? "https://example.com";

  const payload = {
    TerminalNumber: Number(terminalNumber),
    ApiName: apiName,
    ApiPassword: apiPassword,
    Operation: "ChargeOnly",
    Amount: body.subtotal,
    ReturnValue: body.customer.phone,
    SuccessRedirectUrl: `${siteUrl}/checkout/success`,
    FailedRedirectUrl: `${siteUrl}/checkout/failed`,
    WebHookUrl: `${siteUrl}/api/cardcom/webhook`,
    ProductName: "הזמנה - ויוסי דגים",
    Document: {
      Name: body.customer.fullName,
      Email: body.customer.email,
      Products: body.items.map((item) => ({
        Description: item.name,
        Quantity: item.quantity,
        UnitCost: item.price,
      })),
    },
  };

  const response = await fetch(`${CARDCOM_API_BASE}/LowProfile/Create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { ResponseCode?: number; Url?: string; Description?: string };

  if (data.ResponseCode !== 0 || !data.Url) {
    return { error: data.Description ?? "קארדקום דחתה את הבקשה" };
  }

  return { url: data.Url };
}
