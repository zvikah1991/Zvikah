import { useCallback, useEffect, useState } from "react";
import type { AdsMeta, KeywordPerfRecord } from "../types";
import seedRecords from "../data/adsKeywordSeedData.json";
import {
  clearStoredKeywordData,
  loadStoredKeywordData,
  loadTargetCostPerCall,
  saveKeywordData,
  saveTargetCostPerCall,
} from "../lib/storage";
import { parseKeywordExport, parseKeywordFile } from "../lib/keywordParser";

const SEED_META: AdsMeta = {
  updatedAt: "2026-08-31T18:00:00.000Z",
  fileName: "נתוני דוגמה (מומצאים — אינם קמפיין אמיתי)",
  recordCount: (seedRecords as KeywordPerfRecord[]).length,
};

export function useKeywordData() {
  const [records, setRecords] = useState<KeywordPerfRecord[]>([]);
  const [meta, setMeta] = useState<AdsMeta | null>(null);
  const [targetCostPerCall, setTargetCostPerCall] = useState(7);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingSeed, setIsUsingSeed] = useState(false);

  useEffect(() => {
    const stored = loadStoredKeywordData();
    setTargetCostPerCall(loadTargetCostPerCall());
    if (stored && stored.records.length > 0) {
      setRecords(stored.records);
      setMeta(stored.meta);
      setIsUsingSeed(false);
    } else {
      setRecords(seedRecords as KeywordPerfRecord[]);
      setMeta(SEED_META);
      setIsUsingSeed(true);
    }
  }, []);

  const ingest = useCallback((parsed: KeywordPerfRecord[], fileName?: string) => {
    const newMeta: AdsMeta = { updatedAt: new Date().toISOString(), fileName, recordCount: parsed.length };
    saveKeywordData(parsed, newMeta);
    setRecords(parsed);
    setMeta(newMeta);
    setIsUsingSeed(false);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const parsed = await parseKeywordFile(file);
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
        const parsed = parseKeywordExport(text);
        ingest(parsed, "הודבק ידנית מגוגל אדס");
      } catch (e) {
        setError(e instanceof Error ? e.message : "שגיאה בפענוח הטקסט שהודבק");
      }
    },
    [ingest],
  );

  const updateTarget = useCallback((target: number) => {
    setTargetCostPerCall(target);
    saveTargetCostPerCall(target);
  }, []);

  const resetToSeed = useCallback(() => {
    clearStoredKeywordData();
    setRecords(seedRecords as KeywordPerfRecord[]);
    setMeta(SEED_META);
    setIsUsingSeed(true);
    setError(null);
  }, []);

  return {
    records,
    meta,
    targetCostPerCall,
    updateTarget,
    uploadFile,
    pasteText,
    resetToSeed,
    isUploading,
    isUsingSeed,
    error,
    clearError: () => setError(null),
  };
}
