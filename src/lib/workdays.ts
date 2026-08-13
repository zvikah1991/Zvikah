// Israeli work week: Sunday–Thursday. Friday/Saturday are the weekend.
export function isWorkDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 5 && day !== 6;
}

export function workDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) if (isWorkDay(new Date(year, month - 1, d))) count++;
  return count;
}

/** Work days from the 1st through today (inclusive) for the current month; full month if it's already past; 0 if it's still in the future. */
export function workDaysElapsedInMonth(year: number, month: number, today: Date = new Date()): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  if (year > todayY || (year === todayY && month > todayM)) return 0;
  const uptoDay = year === todayY && month === todayM ? today.getDate() : daysInMonth;
  let count = 0;
  for (let d = 1; d <= uptoDay; d++) if (isWorkDay(new Date(year, month - 1, d))) count++;
  return count;
}

/** The calendar day-of-month on which the Nth work day of the month falls (capped to the month's last day). */
export function calendarDayForNthWorkDay(year: number, month: number, n: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  if (n <= 0) return 0;
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (isWorkDay(new Date(year, month - 1, d))) {
      count++;
      if (count === n) return d;
    }
  }
  return daysInMonth;
}
