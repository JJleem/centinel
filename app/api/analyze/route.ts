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

// Robust JSON parser: cleans up common Claude output issues before giving up
function parseJSON<T>(text: string, stage: string): T {
  // 1st attempt: extract outermost {...} and parse directly
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      // fall through to cleanup
    }
  }

  // 2nd attempt: clean trailing commas then retry
  const cleaned = (match?.[0] ?? text)
    .replace(/,\s*([}\]])/g, "$1")   // trailing commas before } or ]
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":'); // unquoted keys
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through to bracket recovery
  }

  // 3rd attempt: close unclosed brackets/braces (token-limit truncation)
  let recovered = cleaned;
  const opens = [...recovered].reduce((acc, ch) => {
    if (ch === "{") return acc + 1;
    if (ch === "}") return acc - 1;
    return acc;
  }, 0);
  const arrOpens = [...recovered].reduce((acc, ch) => {
    if (ch === "[") return acc + 1;
    if (ch === "]") return acc - 1;
    return acc;
  }, 0);
  // remove trailing incomplete value (last comma or partial string)
  recovered = recovered.replace(/,\s*$/, "").replace(/"[^"]*$/, '"...');
  recovered += "]".repeat(Math.max(0, arrOpens)) + "}".repeat(Math.max(0, opens));
  try {
    return JSON.parse(recovered) as T;
  } catch {
    // all attempts failed
  }

  throw new Error(
    `${stage}: JSON parse failed.\nReceived text (first 500 chars):\n${text.slice(0, 500)}`
  );
}

const LANG_INSTRUCTION: Record<string, string> = {
  EN: "Respond in English.",
  KO: "한국어로 답변해줘.",
};

// Stage 1: Trend Analyst
async function analyzeTrends(games: GameData[], lang: string): Promise<TrendAnalysis> {
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
        content: `Analyze these top mobile games and extract trends:\n\n${gameListText}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "mechanics": ["mechanic1", "mechanic2", "mechanic3"],
  "revenueModels": ["model1", "model2"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "rawAnalysis": "2-3 sentence analysis of the overall trends"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseJSON<TrendAnalysis>(text, "Stage 1");
}

// Stage 2: Insight Summarizer
async function summarizeInsights(
  trendAnalysis: TrendAnalysis,
  lang: string
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: "Mobile gaming insight expert for UA marketers. Be concise. Respond in valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Based on this trend analysis, create a concise insight summary:\n\nMechanics: ${trendAnalysis.mechanics.join(", ")}\nRevenue Models: ${trendAnalysis.revenueModels.join(", ")}\nKeywords: ${trendAnalysis.keywords.join(", ")}\nAnalysis: ${trendAnalysis.rawAnalysis}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "summary": ["insight line 1", "insight line 2", "insight line 3"],
  "topKeywords": ["keyword1", "keyword2", "keyword3"]
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseJSON<InsightSummary>(text, "Stage 2");
}

// Stage 3: Ad Copywriter (generates 5 ad copies)
async function generateAdCopies(
  insight: InsightSummary,
  query: string,
  lang: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: "Mobile game UA copywriter. Create conversion-optimized ad creatives. Respond in valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Create 5 distinct ad copies for a hyper-casual game in the "${query}" space.\n\nMarket Insights:\n${insight.summary.join("\n")}\nTop Keywords: ${insight.topKeywords.join(", ")}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
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

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = parseJSON<{ adCopies: AdCopy[] }>(text, "Stage 3");
  return parsed.adCopies;
}

export async function POST(req: NextRequest) {
  const { query, games, lang = "EN" } = await req.json();

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
    const trendAnalysis = await analyzeTrends(games as GameData[], lang);
    const insight = await summarizeInsights(trendAnalysis, lang);
    const adCopies = await generateAdCopies(insight, query, lang);

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
