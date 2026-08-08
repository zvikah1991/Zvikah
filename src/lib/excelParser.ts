import { readSheet } from "read-excel-file/browser";
import type { SalesRecord } from "../types";

// Maps the Hebrew column headers used by the CRM's "WorkflowsExport" report
// to our internal field names. Matching by header name (not column position)
// keeps the importer working even if the export tool reorders columns.
const HEADER_MAP: Record<string, keyof SalesRecord> = {
  "מספר תהליך": "id",
  "סוג תהליך": "processType",
  "לקוח": "customer",
  "סטטוס": "status",
  "מטפל": "rep",
  "תאריך טיפול נדרש": "requiredDate",
  "פרמיה צפויה": "expectedPremium",
  "בעלים": "owner",
  "מזהה לקוח": "customerId",
  "יצרן חדש": "insurer",
  "סוג מוצר חדש": "productType",
};

const REQUIRED_HEADER = "מספר תהליך";

export class ExcelParseError extends Error {}

function toStringOrNull(cell: unknown): string | null {
  if (cell === null || cell === undefined) return null;
  const s = String(cell).trim();
  return s === "" ? null : s;
}

function toNumberOrNull(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  const parsed = Number(String(cell).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODateOrNull(cell: unknown): string | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (cell instanceof Date) {
    return `${cell.getFullYear()}-${pad2(cell.getMonth() + 1)}-${pad2(cell.getDate())}`;
  }
  if (typeof cell === "string") {
    const trimmed = cell.trim();
    const dmy = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
    if (dmy) {
      const [, d, m, yRaw] = dmy;
      const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
      return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
    }
    const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      const [, y, m, d] = ymd;
      return `${y}-${pad2(Number(m))}-${pad2(Number(d))}`;
    }
  }
  return null;
}

/**
 * Parses a "WorkflowsExport" .xlsx file (exported daily from the CRM) into
 * normalized SalesRecord objects. Each upload is treated as a full,
 * up-to-date snapshot of all processes, so the importer does not attempt to
 * merge with previously stored data — the caller replaces the dataset wholesale.
 */
export async function parseWorkflowsExcel(file: File): Promise<SalesRecord[]> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new ExcelParseError("יש להעלות קובץ מסוג xlsx. בדוק/י את פורמט הקובץ שיוצא מהמערכת.");
  }

  const rows = await readSheet(file);
  if (!rows.length) {
    throw new ExcelParseError("הקובץ שהועלה ריק.");
  }

  const headers = rows[0].map((h) => String(h ?? "").trim());
  if (!headers.includes(REQUIRED_HEADER)) {
    throw new ExcelParseError(
      `הקובץ אינו בפורמט הצפוי — לא נמצאה העמודה "${REQUIRED_HEADER}". ודא/י שמדובר בדו"ח "WorkflowsExport" מהמערכת.`,
    );
  }

  const columnIndexByField = new Map<keyof SalesRecord, number>();
  headers.forEach((header, index) => {
    const field = HEADER_MAP[header];
    if (field) columnIndexByField.set(field, index);
  });

  const records: SalesRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => cell === null || cell === undefined || cell === "")) continue;

    const cellFor = (field: keyof SalesRecord) => {
      const idx = columnIndexByField.get(field);
      return idx === undefined ? null : (row[idx] ?? null);
    };

    const id = toNumberOrNull(cellFor("id"));
    if (id === null) continue;

    records.push({
      id,
      processType: toStringOrNull(cellFor("processType")),
      customer: toStringOrNull(cellFor("customer")),
      status: toStringOrNull(cellFor("status")),
      rep: toStringOrNull(cellFor("rep")),
      requiredDate: toISODateOrNull(cellFor("requiredDate")),
      expectedPremium: toNumberOrNull(cellFor("expectedPremium")),
      owner: toStringOrNull(cellFor("owner")),
      customerId: toNumberOrNull(cellFor("customerId")),
      insurer: toStringOrNull(cellFor("insurer")),
      productType: toStringOrNull(cellFor("productType")),
    });
  }

  if (records.length === 0) {
    throw new ExcelParseError("לא נמצאו רשומות תקינות בקובץ.");
  }

  return records;
}
