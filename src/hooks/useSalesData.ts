import { useCallback, useEffect, useState } from "react";
import type { DataMeta, SalesRecord } from "../types";
import seedRecords from "../data/seedData.json";
import { clearStoredData, loadStoredData, saveData } from "../lib/storage";
import { parseWorkflowsExcel } from "../lib/excelParser";

const SEED_META: DataMeta = {
  updatedAt: "2026-08-08T08:39:01.000Z",
  fileName: "WorkflowsExport_172026_083901.xlsx (נתוני דוגמה)",
  recordCount: (seedRecords as SalesRecord[]).length,
};

export function useSalesData() {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingSeed, setIsUsingSeed] = useState(false);

  useEffect(() => {
    const stored = loadStoredData();
    if (stored && stored.records.length > 0) {
      setRecords(stored.records);
      setMeta(stored.meta);
      setIsUsingSeed(false);
    } else {
      setRecords(seedRecords as SalesRecord[]);
      setMeta(SEED_META);
      setIsUsingSeed(true);
    }
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const parsed = await parseWorkflowsExcel(file);
      const newMeta: DataMeta = {
        updatedAt: new Date().toISOString(),
        fileName: file.name,
        recordCount: parsed.length,
      };
      saveData(parsed, newMeta);
      setRecords(parsed);
      setMeta(newMeta);
      setIsUsingSeed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בקריאת הקובץ");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const resetToSeed = useCallback(() => {
    clearStoredData();
    setRecords(seedRecords as SalesRecord[]);
    setMeta(SEED_META);
    setIsUsingSeed(true);
    setError(null);
  }, []);

  return { records, meta, uploadFile, resetToSeed, isUploading, isUsingSeed, error, clearError: () => setError(null) };
}
