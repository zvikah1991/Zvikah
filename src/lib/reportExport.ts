import type ExcelJS from 'exceljs';
import type { EmployeeMonthReport } from './monthlyReport';
import { exportSectionsToPdf, reportPageStyles } from './exportPdf';
import { formatDateHe, formatDurationShort, hebrewMonthName } from './time';
import { STATUS_LABEL } from './reportData';

const HEADER_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true };
const TOTAL_FILL: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };

function setupSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ rightToLeft: true }];
}

export async function exportCompanySummaryExcel(companyName: string, year: number, month: number, reports: EmployeeMonthReport[]) {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')]);
  const wb = new ExcelJS.Workbook();
  wb.creator = companyName;
  wb.created = new Date();

  const sheet = wb.addWorksheet('סיכום חודשי');
  setupSheet(sheet);

  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value = `${companyName} — דוח נוכחות חודשי: ${hebrewMonthName(month)} ${year}`;
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'right' };
  sheet.getRow(1).height = 26;

  const headerRow = sheet.addRow([
    'שם עובד', 'תפקיד', 'ימי עבודה', 'שעות רגילות', 'שעות נוספות', 'ימי חופשה', 'ימי מחלה', 'היעדרויות אחרות', 'סה״כ שעות', 'אומדן שכר (₪)',
  ]);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'right' };
  });

  reports.forEach((r) => {
    const row = sheet.addRow([
      r.employee.full_name,
      r.employee.job_title ?? '',
      r.totals.workDays,
      formatDurationShort(r.totals.regularMinutes),
      formatDurationShort(r.totals.overtimeTier1Minutes + r.totals.overtimeTier2Minutes),
      r.vacationDays,
      r.sickDays,
      r.otherAbsenceDays,
      formatDurationShort(r.totals.totalMinutes),
      r.estimatedWage != null ? r.estimatedWage : '',
    ]);
    row.eachCell((cell) => (cell.alignment = { horizontal: 'right' }));
  });

  const totalsRow = sheet.addRow([
    'סה״כ',
    '',
    reports.reduce((s, r) => s + r.totals.workDays, 0),
    formatDurationShort(reports.reduce((s, r) => s + r.totals.regularMinutes, 0)),
    formatDurationShort(reports.reduce((s, r) => s + r.totals.overtimeTier1Minutes + r.totals.overtimeTier2Minutes, 0)),
    reports.reduce((s, r) => s + r.vacationDays, 0),
    reports.reduce((s, r) => s + r.sickDays, 0),
    reports.reduce((s, r) => s + r.otherAbsenceDays, 0),
    formatDurationShort(reports.reduce((s, r) => s + r.totals.totalMinutes, 0)),
    reports.reduce((s, r) => s + (r.estimatedWage ?? 0), 0).toFixed(2),
  ]);
  totalsRow.eachCell((cell) => {
    cell.fill = TOTAL_FILL;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'right' };
  });

  sheet.columns.forEach((col) => {
    col.width = 16;
  });
  sheet.getColumn(1).width = 22;
  sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 10 } };
  sheet.views = [{ rightToLeft: true, state: 'frozen', ySplit: 2 }];

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `דוח-נוכחות-${hebrewMonthName(month)}-${year}.xlsx`);
}

export async function exportEmployeeDetailExcel(companyName: string, year: number, month: number, report: EmployeeMonthReport) {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')]);
  const wb = new ExcelJS.Workbook();
  wb.creator = companyName;

  const sheet = wb.addWorksheet('פירוט יומי');
  setupSheet(sheet);

  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = `${report.employee.full_name} — פירוט נוכחות: ${hebrewMonthName(month)} ${year}`;
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'right' };

  const headerRow = sheet.addRow(['תאריך', 'יום', 'כניסה', 'יציאה', 'הפסקה', 'שעות עבודה', 'סטטוס']);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'right' };
  });

  report.rows.forEach((row) => {
    const r = sheet.addRow([
      formatDateHe(row.date),
      row.dayName,
      row.clockIn ? new Date(row.clockIn).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '',
      row.clockOut ? new Date(row.clockOut).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '',
      row.breakMinutes > 0 ? formatDurationShort(row.breakMinutes) : '',
      row.computation.workedMinutes > 0 ? formatDurationShort(row.computation.workedMinutes) : '',
      STATUS_LABEL[row.status],
    ]);
    r.eachCell((cell) => (cell.alignment = { horizontal: 'right' }));
  });

  sheet.columns.forEach((col) => (col.width = 16));
  sheet.views = [{ rightToLeft: true, state: 'frozen', ySplit: 2 }];

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `נוכחות-${report.employee.full_name}-${hebrewMonthName(month)}-${year}.xlsx`);
}

export async function exportCompanySummaryPdf(companyName: string, year: number, month: number, reports: EmployeeMonthReport[]) {
  const totalMinutes = reports.reduce((s, r) => s + r.totals.totalMinutes, 0);
  const totalOt = reports.reduce((s, r) => s + r.totals.overtimeTier1Minutes + r.totals.overtimeTier2Minutes, 0);

  const html = `
    ${reportPageStyles()}
    <div class="rpt">
      <h1>${companyName} — דוח נוכחות חודשי</h1>
      <p class="subtitle">${hebrewMonthName(month)} ${year} · הופק בתאריך ${formatDateHe(new Date().toISOString().slice(0, 10))}</p>
      <table>
        <thead>
          <tr>
            <th>שם עובד</th><th>ימי עבודה</th><th>שעות רגילות</th><th>שעות נוספות</th>
            <th>חופשה</th><th>מחלה</th><th>היעדרויות</th><th>סה״כ שעות</th>
          </tr>
        </thead>
        <tbody>
          ${reports
            .map(
              (r) => `
            <tr>
              <td>${r.employee.full_name}</td>
              <td>${r.totals.workDays}</td>
              <td>${formatDurationShort(r.totals.regularMinutes)}</td>
              <td>${formatDurationShort(r.totals.overtimeTier1Minutes + r.totals.overtimeTier2Minutes)}</td>
              <td>${r.vacationDays}</td>
              <td>${r.sickDays}</td>
              <td>${r.otherAbsenceDays}</td>
              <td>${formatDurationShort(r.totals.totalMinutes)}</td>
            </tr>`,
            )
            .join('')}
          <tr class="totals-row">
            <td>סה״כ</td>
            <td>${reports.reduce((s, r) => s + r.totals.workDays, 0)}</td>
            <td>${formatDurationShort(reports.reduce((s, r) => s + r.totals.regularMinutes, 0))}</td>
            <td>${formatDurationShort(totalOt)}</td>
            <td>${reports.reduce((s, r) => s + r.vacationDays, 0)}</td>
            <td>${reports.reduce((s, r) => s + r.sickDays, 0)}</td>
            <td>${reports.reduce((s, r) => s + r.otherAbsenceDays, 0)}</td>
            <td>${formatDurationShort(totalMinutes)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  await exportSectionsToPdf([html], `דוח-נוכחות-${hebrewMonthName(month)}-${year}.pdf`);
}

export async function exportEmployeeDetailPdf(companyName: string, year: number, month: number, report: EmployeeMonthReport) {
  const html = `
    ${reportPageStyles()}
    <div class="rpt">
      <h1>${report.employee.full_name} — פירוט נוכחות יומי</h1>
      <p class="subtitle">${companyName} · ${hebrewMonthName(month)} ${year}</p>
      <table>
        <thead>
          <tr><th>תאריך</th><th>יום</th><th>כניסה</th><th>יציאה</th><th>הפסקה</th><th>שעות עבודה</th><th>סטטוס</th></tr>
        </thead>
        <tbody>
          ${report.rows
            .filter((r) => r.status !== 'future')
            .map(
              (row) => `
            <tr>
              <td>${formatDateHe(row.date)}</td>
              <td>${row.dayName}</td>
              <td>${row.clockIn ? new Date(row.clockIn).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              <td>${row.clockOut ? new Date(row.clockOut).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              <td>${row.breakMinutes > 0 ? formatDurationShort(row.breakMinutes) : '—'}</td>
              <td>${row.computation.workedMinutes > 0 ? formatDurationShort(row.computation.workedMinutes) : '—'}</td>
              <td>${STATUS_LABEL[row.status]}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  await exportSectionsToPdf([html], `נוכחות-${report.employee.full_name}-${hebrewMonthName(month)}-${year}.pdf`);
}
