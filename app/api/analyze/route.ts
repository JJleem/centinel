import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  GameData,
  TrendAnalysis,
  InsightSummary,
  AdCopy,
  AnalysisResult,
} from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";

// Stage 1: Trend Analyst
async function analyzeTrends(games: GameData[]): Promise<TrendAnalysis> {
  const gameListText = games
    .map(
      (g, i) =>
        `${i + 1}. ${g.title} (${g.developer}) - Genre: ${g.genre}, Score: ${g.score}, Installs: ${g.installs}\nDescription: ${g.description}`
    )
    .join("\n\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: "Mobile game trend analyst. Extract patterns from game data. Respond in valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Analyze these top mobile games and extract trends:\n\n${gameListText}\n\nRespond with JSON in this exact format:
{
  "mechanics": ["mechanic1", "mechanic2", "mechanic3"],
  "revenueModels": ["model1", "model2"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "rawAnalysis": "2-3 sentence analysis of the overall trends"
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Stage 1: Failed to parse JSON");
  return JSON.parse(jsonMatch[0]) as TrendAnalysis;
}

// Stage 2: Insight Summarizer
async function summarizeInsights(
  trendAnalysis: TrendAnalysis
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: "Mobile gaming insight expert for UA marketers. Be concise. Respond in valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Based on this trend analysis, create a concise insight summary:\n\nMechanics: ${trendAnalysis.mechanics.join(", ")}\nRevenue Models: ${trendAnalysis.revenueModels.join(", ")}\nKeywords: ${trendAnalysis.keywords.join(", ")}\nAnalysis: ${trendAnalysis.rawAnalysis}\n\nRespond with JSON in this exact format:
{
  "summary": ["insight line 1", "insight line 2", "insight line 3"],
  "topKeywords": ["keyword1", "keyword2", "keyword3"]
}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Stage 2: Failed to parse JSON");
  return JSON.parse(jsonMatch[0]) as InsightSummary;
}

// Stage 3: Ad Copywriter (generates 5 ad copies)
async function generateAdCopies(
  insight: InsightSummary,
  query: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: "Mobile game UA copywriter. Create conversion-optimized ad creatives. Respond in valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Create 5 distinct ad copies for a hyper-casual game in the "${query}" space.\n\nMarket Insights:\n${insight.summary.join("\n")}\nTop Keywords: ${insight.topKeywords.join(", ")}\n\nRespond with JSON in this exact format:
{
  "adCopies": [
    {
      "hook": "attention-grabbing opening line (max 10 words)",
      "mainCopy": "main ad copy (2-3 sentences)",
      "shortFormScript": "15-second video script narration",
      "appStoreDescription": "app store short description (max 80 chars)",
      "targetKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Make each of the 5 copies distinct in tone: 1) Excitement, 2) Challenge, 3) Curiosity, 4) FOMO, 5) Simplicity.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Stage 3: Failed to parse JSON");
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.adCopies as AdCopy[];
}

export async function POST(req: NextRequest) {
  const { query, games } = await req.json();

  if (!query || !games || !Array.isArray(games)) {
    return NextResponse.json(
      { error: "query and games are required" },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    // Sequential 3-stage orchestration
    const trendAnalysis = await analyzeTrends(games as GameData[]);
    const insight = await summarizeInsights(trendAnalysis);
    const adCopies = await generateAdCopies(insight, query);

    const result: AnalysisResult = {
      query,
      games: games as GameData[],
      trendAnalysis,
      insight,
      adCopies,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[analyze] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}
