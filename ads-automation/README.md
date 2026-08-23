# אוטומציה לקמפיין גוגל אדס

כלים שמבצעים שינויים אמיתיים בחשבון Google Ads שלכם — לא רק דוחות. בגלל זה כל שינוי (Pause, הוספת מילת מפתח, שינוי הצעת מחיר) **דורש אישור מפורש**: כל סקריפט קודם מדפיס בדיוק מה הוא הולך לעשות (Dry Run), ורק כשמריצים אותו שוב עם `--confirm` הוא באמת שולח את השינוי לגוגל.

## הרשאה — מה שרק אתם יכולים לעשות (חד פעמי)

גוגל לא מאפשרת "לתת גישה" לכלי חיצוני בקליק — יש תהליך רשמי שהבעלים בלבד יכול לאשר:

### 1. חשבון Google Ads Manager (MCC)

אם עדיין אין לכם — [ads.google.com/home/tools/manager-accounts](https://ads.google.com/home/tools/manager-accounts), חינמי, כמה דקות. מקשרים אליו את חשבון הקמפיין הקיים (Tools & Settings → Setup → Linked accounts).

### 2. Developer Token

בתוך ה-MCC: **Tools & Settings → Setup → API Center** → מבקשים Developer Token, ממלאים טופס קצר על מטרת השימוש ("ניהול עצמי של קמפיין השיחות של הסוכנות"). **גוגל בודקת ומאשרת תוך כמה ימי עסקים** — זה השלב היחיד שלא תלוי בכם.

עד לאישור, ה-Developer Token עובד רק מול **Test accounts** — אפשר להתחיל להכין הכל, אבל שינויים אמיתיים בחשבון ימתינו לאישור.

### 3. פרויקט ב-Google Cloud + OAuth Client

ב-[console.cloud.google.com](https://console.cloud.google.com) (חינמי):

1. יוצרים פרויקט חדש (או משתמשים בקיים).
2. **APIs & Services → Library** → מחפשים "Google Ads API" → Enable.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → סוג: **Desktop app**.
4. מעתיקים את ה-Client ID וה-Client Secret שמתקבלים.

### 4. הגדרה מקומית + קבלת Refresh Token

```bash
cd ads-automation
npm install
cp .env.example .env
```

פותחים את `.env` וממלאים `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET` (משלב 3), `GOOGLE_ADS_DEVELOPER_TOKEN` (משלב 2), `GOOGLE_ADS_CUSTOMER_ID` (מזהה חשבון הקמפיין, בפינה הימנית העליונה ב-Google Ads).

ואז:

```bash
npm run auth
```

זה יפתח דפדפן, תתחברו ותאשרו גישה לחשבון הגוגל שמנהל את הקמפיין. בסיום יודפס לכם `GOOGLE_ADS_REFRESH_TOKEN=...` — מעתיקים את השורה הזו לקובץ `.env`.

**זהו — ההרשאה מוכנה.** אפשר לבטל אותה בכל רגע דרך [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

> `.env` מכיל סודות אמיתיים ולעולם לא מועלה ל-git (הוא ב-`.gitignore`). אל תשתפו את הקובץ הזה.

## שימוש

כל הפקודות מריצים מתוך תיקיית `ads-automation/`.

### דוח — בלי לשנות כלום (בטוח תמיד)

```bash
node listKeywords.js --days 30
node listKeywords.js --days 30 --out report.csv   # אפשר להעלות את הקובץ ישירות לכלי בדשבורד
```

### השהיית מילת מפתח

```bash
node pauseKeyword.js --keyword "איילון ביטוח חיים"          # dry run — מציג מה יקרה
node pauseKeyword.js --keyword "איילון ביטוח חיים" --confirm # מבצע בפועל
```

### הוספת גרסת Phrase לצד מילה קיימת ב"התאמה רחבה"

```bash
node addPhraseKeyword.js --keyword "הראל ביטוח בריאות טלפון" --confirm
```

הגרסה הישנה (רחבה) נשארת פעילה — הסקריפט הזה לעולם לא משהה אותה בעצמו. משהים אותה ידנית (או עם `pauseKeyword.js`) אחרי שראיתם שהגרסה החדשה עובדת.

### עדכון Target CPA (אסטרטגיית הצעות מחיר)

```bash
node setTargetCpa.js --campaign "ביטוח חיים בריאות" --target 13 --confirm
```

#### גלגול בטוח — לא לקפוץ ישר ל-7₪

קפיצה גדולה ביעד יכולה לגרום לאלגוריתם "להיבהל" ולצמצם יותר מדי, בדיוק הסיכון שרוצים להימנע ממנו. במקום זה, בכל שלב מחכים 3-4 ימים ובודקים שכמות השיחות (`listKeywords.js`) לא ירדה לפני שממשיכים לשלב הבא:

```bash
node setTargetCpa.js --campaign "..." --target 13 --confirm   # שבוע 1-2
node setTargetCpa.js --campaign "..." --target 10 --confirm   # אחרי שהתייצב
node setTargetCpa.js --campaign "..." --target 7  --confirm   # אחרי שהתייצב שוב
```

אם בשלב כלשהו כמות השיחות יורדת — מריצים שוב עם היעד הקודם (הגבוה יותר) כדי לחזור אחורה; זה תמיד הפיך.

## מה הכלים האלה *לא* עושים

- לא נוגעים בתקציב הכללי של הקמפיין.
- לא משהים קמפיין שלם ולא קמפיינים על אסטרטגיית הצעות מחיר משותפת (Portfolio) — אלה דורשים טיפול ידני מכוון, לא אוטומציה גורפת.
- לא מבצעים שום דבר בלי `--confirm` מפורש בכל הרצה בנפרד.
