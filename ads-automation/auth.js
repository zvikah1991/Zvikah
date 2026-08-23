// One-time setup: obtains the refresh token that lets the other scripts act on the
// account without you re-logging in every time. Run this once (`npm run auth`), approve
// access in the browser window it opens, then paste the printed line into your .env file.
//
// You can revoke this access at any time from https://myaccount.google.com/permissions.
import "dotenv/config";
import http from "node:http";
import { OAuth2Client } from "google-auth-library";
import open from "open";

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/adwords";

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("חסרים GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET ב-.env — השלימו קודם את שלב 3 ב-README.md.");
  process.exit(1);
}

const oauth2Client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // forces Google to re-issue a refresh_token even if you've authorized this app before
  scope: [SCOPE],
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<html><body style='font-family:sans-serif;padding:40px'>אפשר לסגור את החלון הזה ולחזור לטרמינל.</body></html>");
  server.close();

  if (error) {
    console.error(`\n❌ ההרשאה נדחתה או בוטלה: ${error}\n`);
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      console.log(
        "\n⚠️  לא התקבל refresh_token — כנראה שכבר אישרתם גישה בעבר. גשו ל-https://myaccount.google.com/permissions, " +
          "הסירו את הגישה הקיימת של האפליקציה, והריצו שוב את הפקודה הזו.\n",
      );
      process.exit(1);
    }
    console.log("\n✅ ההרשאה הצליחה. הוסיפו את השורה הבאה לקובץ .env שלכם:\n");
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    process.exit(0);
  } catch (e) {
    console.error(`\n❌ שגיאה בקבלת הטוקן: ${e.message}\n`);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("פותח דפדפן להתחברות לחשבון הגוגל שמנהל את הקמפיין...");
  console.log(`אם הוא לא נפתח אוטומטית תוך כמה שניות, העתיקו את הקישור הזה לדפדפן:\n${authUrl}\n`);
  open(authUrl).catch(() => {});
});
