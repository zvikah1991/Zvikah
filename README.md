# Ayalon Kedem Time

מערכת ניהול נוכחות ושעות עבודה מקצה לקצה: Web App מותאמת למובייל (RTL, PWA), מסך עובד פשוט להחתמת כניסה/יציאה/הפסקות, ומערכת ניהול מלאה למנהל — עובדים, בקשות תיקון, חופשות ומחלות, דוחות חודשיים לרואה חשבון עם ייצוא ל-Excel/PDF, אומדן שכר, נעילת חודש ו-Audit Log.

## ארכיטקטורה

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4, RTL מלא, PWA (ניתן להתקנה למסך הבית).
- **Backend**: [Supabase](https://supabase.com) — Postgres, Auth, Storage, Edge Functions. אין שרת נפרד: הלוגיקה העסקית (החתמות, אישור בקשות, נעילת חודש וכו') ממומשת כפונקציות `SECURITY DEFINER` בבסיס הנתונים ונחשפת דרך RPC, כך שעובד לא יכול לעקוף את הכללים גם אם ישנה בקשות API ישירות — ה-RLS חוסם כתיבה ישירה לטבלת הנוכחות.
- **Roles**: `admin` ו-`employee`, מופרדים לחלוטין ברמת ה-RLS של הבסיס נתונים (לא רק בצד הלקוח).

## הקמה ראשונית

### 1. יצירת פרויקט Supabase

1. צור פרויקט חדש ב-[supabase.com](https://supabase.com).
2. ב-SQL Editor, הרץ לפי הסדר את הקבצים מתוך `supabase/migrations/`:
   - `0001_init.sql`
   - `0002_rls_and_functions.sql`
   - `0003_storage.sql`
3. (אופציונלי, מומלץ) התקן את ה-[Supabase CLI](https://supabase.com/docs/guides/cli) ותריץ `supabase link` + `supabase db push` במקום הרצה ידנית.

### 2. פריסת Edge Functions

הוספת עובד, השבתת עובד ואיפוס סיסמה דורשים הרשאות Admin API שאסור לחשוף בצד הלקוח — הן ממומשות כ-Edge Functions עם `service_role key` (מוגדר כ-secret בצד השרת בלבד):

```bash
supabase functions deploy admin-create-employee
supabase functions deploy admin-set-employee-active
supabase functions deploy admin-reset-password
```

### 3. משתני סביבה

```bash
cp .env.example .env
```

מלא ב-`.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

את שני הערכים מוצאים ב-Supabase Dashboard → Project Settings → API.

### 4. יצירת המנהל הראשון

אין מסך הרשמה עצמית במערכת (מכוונת). כדי ליצור את משתמש המנהל הראשון:

1. ב-Supabase Dashboard → Authentication → Users → **Add user**, צור משתמש עם אימייל וסיסמה.
2. ב-SQL Editor:
   ```sql
   update profiles set role = 'admin', full_name = 'שם המנהל' where email = 'admin@example.com';
   ```
3. התחבר למערכת עם אותם פרטים — תועבר אוטומטית לפאנל הניהול.

כל עובד נוסף נוצר דרך מסך "עובדים" באפליקציה (מייצר סיסמה זמנית חד-פעמית להעברה לעובד).

## הרצה מקומית

דורש Node.js 20+.

```bash
npm install
npm run dev
```

```bash
npm run build     # בדיקת build לפרודקשן
npm run lint
```

## פריסה

האפליקציה היא Vite SPA סטטי לחלוטין (ה-build ב-`dist/`) — ניתן לארח בכל שירות אחסון סטטי (Vercel, Netlify וכו'). יש להגדיר את משתני הסביבה (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) בפלטפורמת האחסון. ל-PWA: ודא ש-HTTPS פעיל (נדרש ל-Service Worker).

## מבנה הפרויקט

```
supabase/
  migrations/            סכמת בסיס הנתונים המלאה + RLS + פונקציות RPC
  functions/              Edge Functions ליצירה/השבתה/איפוס סיסמה של עובדים
src/
  lib/supabase.ts         Supabase client
  lib/payroll.ts           מנוע חישוב שעות רגילות/נוספות ואומדן שכר (מבוסס הגדרות, לא כללים מקובעים בקוד)
  lib/reportData.ts        בניית טבלת נוכחות יומית/חודשית לעובד
  lib/monthlyReport.ts      אגרגציה חודשית לכלל העובדים
  lib/reportExport.ts       ייצוא Excel (ExcelJS) ו-PDF (jsPDF + html2canvas, נטען lazy)
  contexts/AuthContext.tsx  ניהול session + role
  routes/ProtectedRoute.tsx  guards לפי הרשאה
  pages/employee/           מסכי עובד (בית, השעות שלי, בקשת תיקון, חופשות)
  pages/admin/               מסכי ניהול (Dashboard, נוכחות, עובדים, בקשות, חופשות, דוחות, שכר, הגדרות, Audit Log)
```

## מודל הרשאות ואבטחה

- **RLS על כל טבלה** — עובד רואה/יוצר רק את הרשומות שלו; מנהל (`profiles.role = 'admin'`) רואה הכל.
- **טבלת `attendance` לא ניתנת לכתיבה ישירה על ידי עובד** — כל שינוי (כניסה, יציאה, הפסקה, אישור תיקון) עובר דרך פונקציות RPC ב-Postgres שאוכפות את כללי העסק (מניעת כניסה כפולה, נעילת חודש וכו') ולא ניתנות לעקיפה משינוי בקשת API בצד הלקוח.
- **Audit Log** — כל פעולה מהותית (החתמות, אישורי בקשות, נעילת/פתיחת חודש, עדכון הגדרות) נרשמת עם מבצע הפעולה, ערך קודם וערך חדש.
- **נעילת חודש** — לאחר סגירה, בקשות תיקון/חופשה לחודש הנעול נחסמות ברמת ה-RPC.

## חוקי שכר ושעות נוספות

חוקי חישוב השעות הנוספות (סף יומי, מדרגות ותעריפים) מוגדרים בטבלת `settings` וניתנים לעריכה ממסך "הגדרות" — הם **אינם מקובעים בקוד**, כך שניתן להתאים אותם לצרכי העסק. אומדן השכר המוצג למנהל הוא הערכה בלבד ואינו מחליף מערכת שכר רשמית או חישוב רואה חשבון.

## הרחבות עתידיות (הארכיטקטורה מוכנה עבורן)

- החתמה לפי מיקום GPS / הגבלה לאזור המשרד — ניתן להוסיף שדות `lat/lng` ל-RPC של `clock_in`/`clock_out` ובדיקת מרחק בצד השרת.
- זיהוי מכשיר, התראה אוטומטית על שכחת יציאה, שליחת דוח אוטומטית לרואה חשבון — ניתן לממש כ-Supabase Edge Function מתוזמנת (Cron).
- מספר סניפים / מנהלים שונים — ניתן להוסיף טבלת `branches` ושיוך ב-`profiles` + הרחבת ה-RLS בהתאם.
- משמרות ושעות מתוכננות — טבלת `shifts` נפרדת המקושרת ל-`attendance`.
