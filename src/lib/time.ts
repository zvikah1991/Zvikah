const HEBREW_DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HEBREW_MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export function hebrewDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return HEBREW_DAY_NAMES[d.getDay()];
}

export function hebrewMonthName(month: number): string {
  return HEBREW_MONTH_NAMES[month - 1];
}

export function formatDateHe(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTimeHe(iso: string | null): string {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimeHe(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** מחזיר "8 שעות ו-52 דקות" */
export function formatDurationLong(minutes: number): string {
  if (minutes <= 0) return '0 דקות';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} שעות`);
  if (m > 0) parts.push(`${m} דקות`);
  return parts.join(' ו-') || '0 דקות';
}

/** מחזיר "08:52" */
export function formatDurationShort(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function diffMinutes(startIso: string, endIso: string | null): number {
  if (!endIso) return 0;
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
}

export function todayDateStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthRange(year: number, month: number): { start: string; end: string; daysInMonth: number } {
  const daysInMonth = new Date(year, month, 0).getDate();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  return { start, end, daysInMonth };
}

/** ימי עבודה (א'-ה') בין שני תאריכים כולל, לצורך קצב חודשי */
export function countWorkdays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 5 && day !== 6) count++;
  }
  return count;
}
