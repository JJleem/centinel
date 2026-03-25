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
  createdAt: string;
  usedFallback?: boolean;
  lang?: string;
}

export interface ScrapeResponse {
  games: GameData[];
  source: "scrape" | "fallback";
  usedFallback: boolean;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
}
