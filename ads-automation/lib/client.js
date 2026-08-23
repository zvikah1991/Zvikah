import "dotenv/config";
import { GoogleAdsApi } from "google-ads-api";

const REQUIRED_VARS = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
];

/** Builds an authenticated Customer client from .env — exits with a clear message if setup isn't finished yet. */
export function getCustomer() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`חסרים משתני סביבה: ${missing.join(", ")}`);
    console.error("העתיקו את .env.example לקובץ .env באותה תיקייה ומלאו את הפרטים — ראו README.md.");
    process.exit(1);
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  return client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "") || undefined,
  });
}

export function formatIls(amount) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 }).format(amount);
}
