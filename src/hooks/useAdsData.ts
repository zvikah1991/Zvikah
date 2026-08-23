import { useCallback, useEffect, useState } from "react";
import type { AdsDayRecord, AdsMeta } from "../types";
import seedRecords from "../data/adsSeedData.json";
import {
  clearStoredAdsData,
  loadAdsBudget,
  loadStoredAdsData,
  saveAdsBudget,
  saveAdsData,
} from "../lib/storage";
import { parseAdsExport, parseAdsFile } from "../lib/adsParser";

const SEED_META: AdsMeta = {
  updatedAt: "2026-08-31T18:00:00.000Z",
  fileName: "נתוני דוגמה (מומצאים — אינם קמפיין אמיתי)",
  recordCount: (seedRecords as AdsDayRecord[]).length,
};

export function useAdsData() {
  const [records, setRecords] = useState<AdsDayRecord[]>([]);
  const [meta, setMeta] = useState<AdsMeta | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingSeed, setIsUsingSeed] = useState(false);

  useEffect(() => {
    const stored = loadStoredAdsData();
    setMonthlyBudget(loadAdsBudget());
    if (stored && stored.records.length > 0) {
      setRecords(stored.records);
      setMeta(stored.meta);
      setIsUsingSeed(false);
    } else {
      setRecords(seedRecords as AdsDayRecord[]);
      setMeta(SEED_META);
      setIsUsingSeed(true);
    }
  }, []);

  const ingest = useCallback((parsed: AdsDayRecord[], fileName?: string) => {
    const newMeta: AdsMeta = { updatedAt: new Date().toISOString(), fileName, recordCount: parsed.length };
    saveAdsData(parsed, newMeta);
    setRecords(parsed);
    setMeta(newMeta);
    setIsUsingSeed(false);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const parsed = await parseAdsFile(file);
        ingest(parsed, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "שגיאה בקריאת הקובץ");
      } finally {
        setIsUploading(false);
      }
    },
    [ingest],
  );

  const pasteText = useCallback(
    (text: string) => {
      setError(null);
      try {
        const parsed = parseAdsExport(text);
        ingest(parsed, "הודבק ידנית מגוגל אדס");
      } catch (e) {
        setError(e instanceof Error ? e.message : "שגיאה בפענוח הטקסט שהודבק");
      }
    },
    [ingest],
  );

  const updateBudget = useCallback((budget: number) => {
    setMonthlyBudget(budget);
    saveAdsBudget(budget);
  }, []);

  const resetToSeed = useCallback(() => {
    clearStoredAdsData();
    setRecords(seedRecords as AdsDayRecord[]);
    setMeta(SEED_META);
    setIsUsingSeed(true);
    setError(null);
  }, []);

  return {
    records,
    meta,
    monthlyBudget,
    updateBudget,
    uploadFile,
    pasteText,
    resetToSeed,
    isUploading,
    isUsingSeed,
    error,
    clearError: () => setError(null),
  };
}
