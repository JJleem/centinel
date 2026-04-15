export interface GameData {
  title: string;
  appId: string;
  developer: string;
  score: number;
  installs: string;
  genre: string;
  description: string;
  icon?: string;
  screenshots?: string[];
  platform?: "google" | "ios" | "both";
  // Google Play chart
  rankChange?: number;   // positive = rising, negative = falling, undefined = no data
  chartRank?: number;   // current rank in chart (1-30), undefined = not in chart
  chartLabel?: string;  // "글로벌탑" | "매출탑" | "캐주얼탑"
  // iOS App Store chart
  iosBundleId?: string; // iOS numeric app ID
  iosChartRank?: number;
  iosChartLabel?: string; // "iOS 글로벌탑" | "iOS 매출탑"
  iosRankChange?: number;
}

export interface RisingInsight {
  appId: string;
  title: string;
  rankChange: number;
  reason: string;
}

export interface VisionResult {
  coreInteraction: string;
  visualHook: string;
  colorPalette: string;
  uiComplexity: number;
  keyVisualElements: string[];
  analyzedCount: number;
}

export interface TrendAnalysis {
  mechanics: string[];
  revenueModels: string[];
  keywords: string[];
  rawAnalysis: string;
}

export interface InsightSummary {
  summary: string[];
  topKeywords: string[];
  notableMechanics?: string[];
  revenueModelTrends?: string[];
  marketOpportunity?: string;
}

export interface AdCopy {
  hook: string;
  mainCopy: string;
  shortFormScript: string;
  appStoreDescription: string;
  targetKeywords: string[];
  imagePrompt: string;
  psychologicalTags: string[];
  expectedCTR: number;
}

export interface AnalysisResult {
  query: string;
  games: GameData[];
  trendAnalysis: TrendAnalysis;
  insight: InsightSummary;
  adCopies: AdCopy[];
  risingInsights?: RisingInsight[];
  visionResult?: VisionResult | null;
  createdAt: string;
  usedFallback?: boolean;
  fallbackGenre?: string;
  lang?: string;
}

export interface ScrapeResponse {
  games: GameData[];
  source: "scrape" | "fallback";
  usedFallback: boolean;
  fallbackGenre?: string;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
}
