import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  GameData,
  TrendAnalysis,
  InsightSummary,
  AdCopy,
  AnalysisResult,
  RisingInsight,
} from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SONNET = "claude-sonnet-4-20250514";
const HAIKU = "claude-haiku-4-5-20251001";

// Robust JSON parser: cleans up common Claude output issues before giving up
function parseJSON<T>(text: string, stage: string): T {
  // Step 0: strip markdown code fences (```json ... ``` or ``` ... ```)
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]) as T; } catch { /* fall through */ }
  }

  const cleaned = (match?.[0] ?? stripped)
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":');
  try { return JSON.parse(cleaned) as T; } catch { /* fall through */ }

  let recovered = cleaned;
  const opens = [...recovered].reduce((n, ch) => n + (ch === "{" ? 1 : ch === "}" ? -1 : 0), 0);
  const arrOpens = [...recovered].reduce((n, ch) => n + (ch === "[" ? 1 : ch === "]" ? -1 : 0), 0);
  recovered = recovered.replace(/,\s*$/, "").replace(/"[^"]*$/, '"...');
  recovered += "]".repeat(Math.max(0, arrOpens)) + "}".repeat(Math.max(0, opens));
  try { return JSON.parse(recovered) as T; } catch { /* fall through */ }

  throw new Error(
    `[JSON Parse Error] Stage: "${stage}"\nReason: All recovery attempts failed.\nReceived text (first 500 chars):\n${text.slice(0, 500)}`
  );
}

const LANG_INSTRUCTION: Record<string, string> = {
  EN: "Respond in English.",
  KO: "한국어로 답변해줘.",
};

// ── Agent 1: Trend Analyst (Sonnet) ────────────────────────────────────────
async function analyzeTrends(games: GameData[], lang: string): Promise<TrendAnalysis> {
  const gameListText = games
    .map((g, i) =>
      `${i + 1}. ${g.title} (${g.developer}) - Genre: ${g.genre}, Score: ${g.score}\nDescription: ${g.description}`
    )
    .join("\n\n");

  const message = await client.messages.create({
    model: SONNET,
    max_tokens: 1000,
    system: "Mobile game trend analyst. Extract patterns from game data. Output raw JSON only — no markdown, no code blocks, no explanation.",
    messages: [{
      role: "user",
      content: `Analyze these top mobile games and extract trends:\n\n${gameListText}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "mechanics": ["mechanic1", "mechanic2", "mechanic3"],
  "revenueModels": ["model1", "model2"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "rawAnalysis": "2-3 sentence analysis of the overall trends"
}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseJSON<TrendAnalysis>(text, "Agent 1: Trend Analyst");
}

// ── Agent 2A: Insight Summarizer — Analytical variant (Haiku) ─────────────
async function summarizeInsightsAnalytical(
  trendAnalysis: TrendAnalysis,
  lang: string
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 2000,
    system: "Mobile gaming insight expert for UA marketers. Focus on data-driven patterns, measurable market signals, and ROI-oriented opportunities. Be concise. Keep each summary item under 120 characters. Output raw JSON only — no markdown, no code blocks, no explanation.",
    messages: [{
      role: "user",
      content: `Based on this trend analysis, create an analytical insight summary:\n\nMechanics: ${trendAnalysis.mechanics.join(", ")}\nRevenue Models: ${trendAnalysis.revenueModels.join(", ")}\nKeywords: ${trendAnalysis.keywords.join(", ")}\nAnalysis: ${trendAnalysis.rawAnalysis}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "summary": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "notableMechanics": ["mechanic1", "mechanic2", "mechanic3"],
  "revenueModelTrends": ["trend1", "trend2"],
  "marketOpportunity": "one key market opportunity for UA marketers"
}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseJSON<InsightSummary>(text, "Agent 2A: Insight (Analytical)");
}

// ── Agent 2B: Insight Summarizer — Creative variant (Haiku) ──────────────
async function summarizeInsightsCreative(
  trendAnalysis: TrendAnalysis,
  lang: string
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 2000,
    system: "Mobile gaming insight expert for UA marketers. Focus on creative opportunities, emerging behavioral trends, and untapped audience segments. Be concise. Keep each summary item under 120 characters. Output raw JSON only — no markdown, no code blocks, no explanation.",
    messages: [{
      role: "user",
      content: `Based on this trend analysis, create a creative insight summary:\n\nMechanics: ${trendAnalysis.mechanics.join(", ")}\nRevenue Models: ${trendAnalysis.revenueModels.join(", ")}\nKeywords: ${trendAnalysis.keywords.join(", ")}\nAnalysis: ${trendAnalysis.rawAnalysis}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "summary": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "notableMechanics": ["mechanic1", "mechanic2", "mechanic3"],
  "revenueModelTrends": ["trend1", "trend2"],
  "marketOpportunity": "one key market opportunity for UA marketers"
}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseJSON<InsightSummary>(text, "Agent 2B: Insight (Creative)");
}

// ── Orchestrator: Synthesize best insight from ensemble (Sonnet) ──────────
async function synthesizeInsight(
  insightA: InsightSummary,
  insightB: InsightSummary,
  lang: string
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 2000,
    system: "Senior mobile gaming strategist. Synthesize the strongest insights from two analyses. Each summary item must be under 100 characters. Output raw JSON only — no markdown, no explanation.",
    messages: [{
      role: "user",
      content: `Synthesize these two parallel insight analyses into one optimal version:\n\nAnalysis A (data-driven):\n${JSON.stringify(insightA)}\n\nAnalysis B (creative):\n${JSON.stringify(insightB)}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "summary": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "notableMechanics": ["mechanic1", "mechanic2", "mechanic3"],
  "revenueModelTrends": ["trend1", "trend2"],
  "marketOpportunity": "one key market opportunity for UA marketers"
}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseJSON<InsightSummary>(text, "Orchestrator: Insight Synthesis");
}

// ── Agent 3A: Ad Copywriter — Performance variant (Haiku) ─────────────────
async function generateAdCopiesPerformance(
  insight: InsightSummary,
  query: string,
  lang: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 4096,
    system: `Mobile game UA copywriter specializing in performance marketing. Create high-CTR, conversion-optimized ad creatives with strong calls-to-action. Output raw JSON only — no markdown, no code blocks, no explanation.
For each ad copy, generate these additional fields:
imagePrompt: Midjourney/DALL-E 3 English image generation prompt. Format: "A [mood] mobile game advertisement thumbnail, [key visual elements], [colors], [composition], isometric 3D style, hyper-casual, clean UI --ar 9:16 --style raw --v 6". Always in English. Max 60 words.
shortFormScript: keep concise, max 60 words.
psychologicalTags: 2~3 psychological targeting tags matching the copy's tone and target audience. Choose from or create new ones based on: "🔥 승부욕 자극", "😌 스트레스 해소", "🧩 두뇌 자극", "😱 FOMO 유발", "✨ ASMR 만족감", "🏆 성취감", "🤔 호기심 폭발", "💪 도전 욕구", "😊 힐링", "⚡ 즉각 만족", "👥 사회적 증거", "🎯 집중력"
expectedCTR: predicted CTR score 1~10 (one decimal). Base on genre/trend fit. The 6 copies must have different scores — highest 7~9, lowest 4~6.
For tone #6 (Empathy/Storytelling): warm and emotional storytelling targeting office workers or people needing a short break. Hook starts from a relatable everyday situation (e.g. "퇴근길 지하철에서...", "점심시간 10분이 남았을 때"). Main copy frames the game as a small escape from daily life. Short-form script: relatable situation → gameplay → healing ending. Psychological tags must include "😌 일상 탈출" and/or "🤝 공감 유발". Image prompt: warm, cozy, soft-lit atmosphere.`,
    messages: [{
      role: "user",
      content: `Create 6 distinct performance-focused ad copies for a hyper-casual game in the "${query}" space.\n\nMarket Insights:\n${insight.summary.join("\n")}\nTop Keywords: ${insight.topKeywords.join(", ")}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "adCopies": [
    {
      "hook": "attention-grabbing opening line (max 10 words)",
      "mainCopy": "main ad copy (2-3 sentences)",
      "shortFormScript": "15-second video script narration",
      "appStoreDescription": "app store short description (max 80 chars)",
      "targetKeywords": ["keyword1", "keyword2", "keyword3"],
      "imagePrompt": "Midjourney/DALL-E 3 English image prompt",
      "psychologicalTags": ["태그1", "태그2"],
      "expectedCTR": 7.5
    }
  ]
}

Make each of the 6 copies distinct in tone: 1) Excitement, 2) Challenge, 3) Curiosity, 4) FOMO, 5) Simplicity, 6) Empathy/Storytelling.`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = parseJSON<{ adCopies: AdCopy[] }>(text, "Agent 3A: Ad Copy (Performance)");
  return parsed.adCopies;
}

// ── Agent 3B: Ad Copywriter — Brand variant (Haiku) ──────────────────────
async function generateAdCopiesBrand(
  insight: InsightSummary,
  query: string,
  lang: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 4096,
    system: `Mobile game UA copywriter specializing in brand storytelling. Create emotionally resonant, memorable ad creatives that build long-term player affinity. Output raw JSON only — no markdown, no code blocks, no explanation.
For each ad copy, generate these additional fields:
imagePrompt: Midjourney/DALL-E 3 English image generation prompt. Format: "A [mood] mobile game advertisement thumbnail, [key visual elements], [colors], [composition], isometric 3D style, hyper-casual, clean UI --ar 9:16 --style raw --v 6". Always in English. Max 60 words.
shortFormScript: keep concise, max 60 words.
psychologicalTags: 2~3 psychological targeting tags matching the copy's tone and target audience. Choose from or create new ones based on: "🔥 승부욕 자극", "😌 스트레스 해소", "🧩 두뇌 자극", "😱 FOMO 유발", "✨ ASMR 만족감", "🏆 성취감", "🤔 호기심 폭발", "💪 도전 욕구", "😊 힐링", "⚡ 즉각 만족", "👥 사회적 증거", "🎯 집중력"
expectedCTR: predicted CTR score 1~10 (one decimal). Base on genre/trend fit. The 6 copies must have different scores — highest 7~9, lowest 4~6.
For tone #6 (Empathy/Storytelling): warm and emotional storytelling targeting office workers or people needing a short break. Hook starts from a relatable everyday situation (e.g. "퇴근길 지하철에서...", "점심시간 10분이 남았을 때"). Main copy frames the game as a small escape from daily life. Short-form script: relatable situation → gameplay → healing ending. Psychological tags must include "😌 일상 탈출" and/or "🤝 공감 유발". Image prompt: warm, cozy, soft-lit atmosphere.`,
    messages: [{
      role: "user",
      content: `Create 6 distinct brand-focused ad copies for a hyper-casual game in the "${query}" space.\n\nMarket Insights:\n${insight.summary.join("\n")}\nTop Keywords: ${insight.topKeywords.join(", ")}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "adCopies": [
    {
      "hook": "attention-grabbing opening line (max 10 words)",
      "mainCopy": "main ad copy (2-3 sentences)",
      "shortFormScript": "15-second video script narration",
      "appStoreDescription": "app store short description (max 80 chars)",
      "targetKeywords": ["keyword1", "keyword2", "keyword3"],
      "imagePrompt": "Midjourney/DALL-E 3 English image prompt",
      "psychologicalTags": ["태그1", "태그2"],
      "expectedCTR": 7.5
    }
  ]
}

Make each of the 6 copies distinct in tone: 1) Excitement, 2) Challenge, 3) Curiosity, 4) FOMO, 5) Simplicity, 6) Empathy/Storytelling.`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = parseJSON<{ adCopies: AdCopy[] }>(text, "Agent 3B: Ad Copy (Brand)");
  return parsed.adCopies;
}

// ── Orchestrator: Select best ad copies from ensemble (Sonnet) ────────────
async function synthesizeAdCopies(
  copiesA: AdCopy[],
  copiesB: AdCopy[],
  query: string,
  lang: string
): Promise<AdCopy[]> {
  const allCopies = [...copiesA, ...copiesB];
  const message = await client.messages.create({
    model: SONNET,
    max_tokens: 4000,
    system: "Senior mobile game UA strategist. Select the best 6 ad copies from 12 — one per tone. Minimal refinement only. Output raw JSON only — no markdown, no explanation.",
    messages: [{
      role: "user",
      content: `From these 12 ad copies for "${query}", select and refine the best 6 (one per tone: Excitement, Challenge, Curiosity, FOMO, Simplicity, Empathy/Storytelling):\n\n${JSON.stringify(allCopies, null, 2)}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
{
  "adCopies": [
    {
      "hook": "...",
      "mainCopy": "...",
      "shortFormScript": "...",
      "appStoreDescription": "...",
      "targetKeywords": ["keyword1", "keyword2", "keyword3"],
      "imagePrompt": "Keep or refine the imagePrompt from the selected copy (must remain in English)",
      "psychologicalTags": ["keep tags from selected copy"],
      "expectedCTR": 7.5
    }
  ]
}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = parseJSON<{ adCopies: AdCopy[] }>(text, "Orchestrator: Ad Copy Synthesis");
  return parsed.adCopies;
}

// ── Agent 0: Why Chart (Haiku, for any game appearing in top chart) ────────
async function analyzeWhyChart(
  chartGames: GameData[],
  lang: string
): Promise<RisingInsight[]> {
  // Limit to top 6 by chartRank to control cost
  const topGames = [...chartGames]
    .sort((a, b) => (a.chartRank ?? 99) - (b.chartRank ?? 99))
    .slice(0, 6);

  const gameList = topGames
    .map((g) => {
      const rankLabel = g.chartRank ? `TOP ${g.chartRank}위` : "인기 게임";
      const changeLabel = (g.rankChange ?? 0) > 0 ? ` (▲${g.rankChange} 급상승)` : (g.rankChange ?? 0) < 0 ? ` (▼${Math.abs(g.rankChange!)} 하락)` : "";
      return `- appId: ${g.appId} | ${g.title} [${rankLabel}${changeLabel}] | Genre: ${g.genre} | Developer: ${g.developer}\n  Description: ${g.description.slice(0, 200)}`;
    })
    .join("\n");

  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 1800,
    system: "Mobile game market analyst. Explain WHY each game is popular in Google Play charts. Be specific — cover gameplay hook, social mechanics, monetization fit. Output raw JSON only.",
    messages: [{
      role: "user",
      content: `These games are currently in Google Play charts:\n\n${gameList}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nFor each game, write 2-3 sentences explaining why it's charting. Cover whichever of these apply: core gameplay hook, retention driver, social/viral mechanic (skip if not applicable), monetization fit, and why it resonates with today's audience. Only mention what actually applies to that specific game.\n\nRespond with JSON:\n{\n  "insights": [\n    { "appId": "com.example", "reason": "..." }\n  ]\n}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = parseJSON<{ insights: { appId: string; reason: string }[] }>(text, "Agent 0: Why Chart");

  return parsed.insights.map((ins) => {
    const game = topGames.find((g) => g.appId === ins.appId);
    return {
      appId: ins.appId,
      title: game?.title ?? ins.appId,
      rankChange: game?.rankChange ?? 0,
      reason: ins.reason,
    };
  });
}

export async function POST(req: NextRequest) {
  const { query, games, lang = "EN" } = await req.json();

  if (!query || !games || !Array.isArray(games)) {
    return NextResponse.json({ error: "query and games are required" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      try {
        // ── Orchestrator Start ──────────────────────────────────────────
        send({ event: "orchestrator_start", message: "오케스트레이터 시작" });

        // ── Stage 1: Trend Analysis + Why Chart (parallel) ────────────
        const chartGames = (games as GameData[]).filter((g) => g.chartRank != null);
        const [trendAnalysis, risingInsights] = await Promise.all([
          analyzeTrends(games as GameData[], lang),
          chartGames.length > 0 ? analyzeWhyChart(chartGames, lang) : Promise.resolve([]),
        ]);
        send({ event: "analysis_done", message: "트렌드 분석 완료 (Sonnet)" });

        // ── Stage 2: Insight Ensemble (2x Haiku, parallel) ────────────
        const [insightA, insightB] = await Promise.all([
          summarizeInsightsAnalytical(trendAnalysis, lang),
          summarizeInsightsCreative(trendAnalysis, lang),
        ]);
        send({ event: "insights_ensemble_done", message: "인사이트 앙상블 완료 (Haiku ×2)" });

        // ── Orchestrator: Synthesize best insight (Sonnet) ─────────────
        const insight = await synthesizeInsight(insightA, insightB, lang);

        // ── Stage 3: Ad Copy Ensemble (2x Haiku, parallel) ────────────
        const [copiesA, copiesB] = await Promise.all([
          generateAdCopiesPerformance(insight, query, lang),
          generateAdCopiesBrand(insight, query, lang),
        ]);
        send({ event: "copies_ensemble_done", message: "광고 소재 앙상블 완료 (Haiku ×2)" });

        // ── Orchestrator: Select best ad copies (Sonnet) ───────────────
        const adCopies = await synthesizeAdCopies(copiesA, copiesB, query, lang);

        const result: AnalysisResult = {
          query,
          games: games as GameData[],
          trendAnalysis,
          insight,
          adCopies,
          risingInsights: risingInsights.length > 0 ? risingInsights : undefined,
          createdAt: new Date().toISOString(),
        };
        send({ event: "final_selection_done", message: "최종 선별 완료", result });
      } catch (error) {
        console.error("[analyze] Orchestrator error:", error);
        send({ error: String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
