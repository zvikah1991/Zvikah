import { useAdsData } from "../../hooks/useAdsData";
import { ErrorBanner } from "../ui/ErrorBanner";
import { AdsImportPanel } from "./AdsImportPanel";
import { AdsKpiCards } from "./AdsKpiCards";
import { AdsTrendChart } from "./AdsTrendChart";
import { CampaignChecklist } from "./CampaignChecklist";
import { KeywordSection } from "./KeywordSection";

export function AdsDashboard() {
  const {
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
    clearError,
  } = useAdsData();

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <AdsImportPanel
        meta={meta}
        isUsingSeed={isUsingSeed}
        isUploading={isUploading}
        monthlyBudget={monthlyBudget}
        onUpload={uploadFile}
        onPaste={pasteText}
        onBudgetChange={updateBudget}
        onReset={resetToSeed}
      />

      <div id="ads-overview" style={{ scrollMarginTop: "112px" }}>
        <AdsKpiCards records={records} monthlyBudget={monthlyBudget} />
      </div>

      <div id="ads-trend" className="grid grid-cols-1 gap-4" style={{ scrollMarginTop: "112px" }}>
        <AdsTrendChart records={records} monthlyBudget={monthlyBudget} delayMs={0} />
      </div>

      <div id="ads-keywords" style={{ scrollMarginTop: "112px" }}>
        <KeywordSection />
      </div>

      <div id="ads-guide" style={{ scrollMarginTop: "112px" }}>
        <CampaignChecklist />
      </div>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)]">
        הנתונים מוזנים ידנית ונשמרים רק בדפדפן שלך — אין חיבור ל-Google Ads API וללא שליחת נתונים לשום שרת
      </footer>
    </div>
  );
}
