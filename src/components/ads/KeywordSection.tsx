import { useKeywordData } from "../../hooks/useKeywordData";
import { ErrorBanner } from "../ui/ErrorBanner";
import { KeywordImportPanel } from "./KeywordImportPanel";
import { KeywordPerformanceTable } from "./KeywordPerformanceTable";

export function KeywordSection() {
  const {
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
    clearError,
  } = useKeywordData();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">ביצועים לפי מילת מפתח — הדרך להוריד את עלות השיחה</h2>
        <p className="text-sm text-[var(--text-muted)]">
          כאן רואים בדיוק אילו מילות מפתח מביאות שיחות בזול ואילו סופגות תקציב בלי להמיר — הצעד המעשי כדי לרדת מהעלות הממוצעת
          הנוכחית ליעד שקבעתם.
        </p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <KeywordImportPanel
        meta={meta}
        isUsingSeed={isUsingSeed}
        isUploading={isUploading}
        targetCostPerCall={targetCostPerCall}
        onUpload={uploadFile}
        onPaste={pasteText}
        onTargetChange={updateTarget}
        onReset={resetToSeed}
      />

      <KeywordPerformanceTable records={records} targetCostPerCall={targetCostPerCall} />
    </div>
  );
}
