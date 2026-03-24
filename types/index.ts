export interface GameData {
  title: string;
  appId: string;
  developer: string;
  score: number;
  installs: string;
  genre: string;
  description: string;
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
}

export interface AdCopy {
  hook: string;
  mainCopy: string;
  shortFormScript: string;
  appStoreDescription: string;
  targetKeywords: string[];
}

export interface AnalysisResult {
  query: string;
  games: GameData[];
  trendAnalysis: TrendAnalysis;
  insight: InsightSummary;
  adCopies: AdCopy[];
  createdAt: string;
}

export interface ScrapeResponse {
  games: GameData[];
  source: "scrape" | "fallback";
}

export interface AnalyzeResponse {
  result: AnalysisResult;
}
