import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  GameData,
  TrendAnalysis,
  InsightSummary,
  AdCopy,
  AnalysisResult,
  RisingInsight,
  VisionResult,
} from "@/types";

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SONNET = "claude-sonnet-4-20250514";

// ── Per-instance rate limiter: 5 requests / 60s per IP ────────────────────
const _rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rl.get(ip);
  if (!entry || now > entry.resetAt) {
    _rl.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}
const HAIKU = "claude-haiku-4-5-20251001";
const TONE_NAMES = ["Excitement", "Challenge", "Curiosity", "FOMO", "Simplicity", "Empathy"] as const;

// Shared system prompt block for Agent 3A & 3B — ~220 tokens saved per call vs duplication
const AD_COPY_SYSTEM_COMMON = `For each ad copy, generate these additional fields:
imagePrompt: Midjourney/DALL-E 3 English image generation prompt. Format: "A [mood] mobile game advertisement thumbnail, [key visual elements], [colors], [composition], isometric 3D style, hyper-casual, clean UI --ar 9:16 --style raw --v 6". Always in English. Max 60 words.
shortFormScript: keep concise, max 60 words.
psychologicalTags: 2~3 psychological targeting tags matching the copy's tone and target audience. Choose from or create new ones based on: "🔥 승부욕 자극", "😌 스트레스 해소", "🧩 두뇌 자극", "😱 FOMO 유발", "✨ ASMR 만족감", "🏆 성취감", "🤔 호기심 폭발", "💪 도전 욕구", "😊 힐링", "⚡ 즉각 만족", "👥 사회적 증거", "🎯 집중력"
expectedCTR: predicted CTR score 1~10 (one decimal). Score based on how well this specific hook fits the game's genre and target audience — NOT based on tone stereotypes (FOMO is not always highest). All 6 scores must be unique. Distribute realistically: winning tone 7.5~9.0, mid tones 5.5~7.4, weakest tone 4.0~5.4. Vary the winner each analysis.
For tone #6 (Empathy/Storytelling): warm and emotional storytelling targeting office workers or people needing a short break. Hook starts from a relatable everyday situation (e.g. "퇴근길 지하철에서...", "점심시간 10분이 남았을 때"). Main copy frames the game as a small escape from daily life. Short-form script: relatable situation → gameplay → healing ending. Psychological tags must include "😌 일상 탈출" and/or "🤝 공감 유발". Image prompt: warm, cozy, soft-lit atmosphere.`;

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
  lang: string,
  visionContext?: string
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 2000,
    system: "Mobile gaming insight expert for UA marketers. Focus on data-driven patterns, measurable market signals, and ROI-oriented opportunities. Be concise. Keep each summary item under 120 characters. Output raw JSON only — no markdown, no code blocks, no explanation.",
    messages: [{
      role: "user",
      content: `Based on this trend analysis, create an analytical insight summary:\n\nMechanics: ${trendAnalysis.mechanics.join(", ")}\nRevenue Models: ${trendAnalysis.revenueModels.join(", ")}\nKeywords: ${trendAnalysis.keywords.join(", ")}\nAnalysis: ${trendAnalysis.rawAnalysis}${visionContext ?? ""}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
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
  lang: string,
  visionContext?: string
): Promise<InsightSummary> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 2000,
    system: "Mobile gaming insight expert for UA marketers. Focus on creative opportunities, emerging behavioral trends, and untapped audience segments. Be concise. Keep each summary item under 120 characters. Output raw JSON only — no markdown, no code blocks, no explanation.",
    messages: [{
      role: "user",
      content: `Based on this trend analysis, create a creative insight summary:\n\nMechanics: ${trendAnalysis.mechanics.join(", ")}\nRevenue Models: ${trendAnalysis.revenueModels.join(", ")}\nKeywords: ${trendAnalysis.keywords.join(", ")}\nAnalysis: ${trendAnalysis.rawAnalysis}${visionContext ?? ""}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
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
    model: SONNET,
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
  lang: string,
  visionContext?: string,
  preferenceContext?: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 4096,
    system: `Mobile game UA copywriter specializing in performance marketing. Create high-CTR, conversion-optimized ad creatives with strong calls-to-action. Output raw JSON only — no markdown, no code blocks, no explanation.\n${AD_COPY_SYSTEM_COMMON}`,
    messages: [{
      role: "user",
      content: `Create 6 distinct performance-focused ad copies for a hyper-casual game in the "${query}" space.\n\nMarket Insights:\n${insight.summary.join("\n")}\nTop Keywords: ${insight.topKeywords.join(", ")}${visionContext ?? ""}${preferenceContext ?? ""}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
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
  lang: string,
  visionContext?: string,
  preferenceContext?: string
): Promise<AdCopy[]> {
  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 4096,
    system: `Mobile game UA copywriter specializing in brand storytelling. Create emotionally resonant, memorable ad creatives that build long-term player affinity. Output raw JSON only — no markdown, no code blocks, no explanation.\n${AD_COPY_SYSTEM_COMMON}`,
    messages: [{
      role: "user",
      content: `Create 6 distinct brand-focused ad copies for a hyper-casual game in the "${query}" space.\n\nMarket Insights:\n${insight.summary.join("\n")}\nTop Keywords: ${insight.topKeywords.join(", ")}${visionContext ?? ""}${preferenceContext ?? ""}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond with JSON in this exact format:
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
// Slim-select pattern: send only hook+ctr per copy → get 6 indices → map to full copies
// Saves ~2,800 tokens vs JSON.stringify(allCopies, null, 2) (3,400 → 600 tokens input)
async function synthesizeAdCopies(
  copiesA: AdCopy[],
  copiesB: AdCopy[],
  query: string,
  lang: string
): Promise<AdCopy[]> {
  const allCopies = [...copiesA, ...copiesB]; // indices 0–5: Perf, 6–11: Brand

  // ctr 제외 — CTR 편향(FOMO 항상 1위)을 막고 hook+copy 품질로만 선택
  const slim = allCopies.map((c, i) => ({
    i,
    variant: i < 6 ? "Perf" : "Brand",
    tone: TONE_NAMES[i % 6],
    hook: c.hook,
    mainCopy: c.mainCopy,
  }));

  const message = await client.messages.create({
    model: SONNET,
    max_tokens: 80,
    system: "Mobile game UA strategist. Pick the best ad copy per tone based on hook strength and copy quality — ignore CTR scores. Output raw JSON only.",
    messages: [{
      role: "user",
      content: `12 ad copies for "${query}" — pick 1 winner per tone (Perf vs Brand) based on which hook is more compelling and specific to this game:\n${JSON.stringify(slim)}\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nRespond: {"selected":[i_Excitement,i_Challenge,i_Curiosity,i_FOMO,i_Simplicity,i_Empathy]}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const { selected } = parseJSON<{ selected: number[] }>(text, "Orchestrator: Ad Copy Synthesis");

  return TONE_NAMES.map((_, t) => {
    const idx = selected[t];
    return (idx >= 0 && idx < allCopies.length) ? allCopies[idx] : allCopies[t];
  });
}

// ── Agent V: Vision Analysis (Sonnet, parallel with trend analysis) ────────
async function analyzeVision(games: GameData[], lang: string): Promise<VisionResult | null> {
  const imageJobs = games
    .map((g) => ({ appId: g.appId, title: g.title, url: g.screenshots?.[0] ?? null }))
    .filter((j): j is { appId: string; title: string; url: string } => j.url !== null);

  if (imageJobs.length < 2) return null;

  // ── Cache check — key: sorted "appId:url" pairs ───────────────────────
  const { supabase } = await import("@/lib/supabase");
  const cacheKey = imageJobs.map((j) => `${j.appId}:${j.url}`).sort().join("|");
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("vision_cache")
    .select("result, analyzed_count")
    .eq("cache_key", cacheKey)
    .gte("created_at", thirtyDaysAgo)
    .single();

  if (cached) {
    console.log("[AgentV] cache HIT");
    return { ...(cached.result as Omit<VisionResult, "analyzedCount">), analyzedCount: cached.analyzed_count };
  }
  console.log("[AgentV] cache MISS — running vision analysis");

  const fetchResults = await Promise.allSettled(
    imageJobs.map(async (job) => {
      const res = await fetch(job.url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error("fetch failed");
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      const validTypes: ImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const mediaType: ImageMediaType = validTypes.find((t) => contentType.includes(t)) ?? "image/jpeg";
      const buffer = await res.arrayBuffer();
      const data = Buffer.from(buffer).toString("base64");
      return { title: job.title, data, mediaType };
    })
  );

  const fetched = fetchResults
    .filter((r): r is PromiseFulfilledResult<{ title: string; data: string; mediaType: ImageMediaType }> => r.status === "fulfilled")
    .map((r) => r.value);

  if (fetched.length < 2) return null;

  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } };

  const imageBlocks: ContentBlock[] = fetched.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.data },
  }));

  const gameList = fetched.map((img, i) => `${i + 1}. ${img.title}`).join("\n");
  const langInstruction = lang === "KO"
    ? "모든 텍스트 필드를 한국어로 작성하세요."
    : "Write all text fields in English.";

  const content: ContentBlock[] = [
    {
      type: "text",
      text: `You are a mobile game UI/UX analyst. Below are ${fetched.length} hyper-casual game screenshots (games: ${gameList}).

Analyze these screenshots and identify patterns across all games. Be thorough and specific.

1. Core interaction mechanic (tap/swipe/drag/tilt — most common across games)
2. Visual hook in first 3 seconds (specific elements that grab attention immediately)
3. Color palette and mood (dominant 3-4 colors, emotional tone)
4. UI complexity level (1=extremely simple, 5=complex — give number and brief reason)
5. Key visual elements that drive engagement (3-5 specific elements observed)

${langInstruction}
Output raw JSON only — no markdown, no code blocks:
{
  "coreInteraction": "2-3 sentence description",
  "visualHook": "2-3 sentence description",
  "colorPalette": "specific colors and emotional mood",
  "uiComplexity": 2,
  "keyVisualElements": ["element 1", "element 2", "element 3", "element 4"]
}`,
    },
    ...imageBlocks,
  ];

  const message = await client.messages.create({
    model: SONNET,
    max_tokens: 1200,
    messages: [{ role: "user", content }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = parseJSON<Omit<VisionResult, "analyzedCount">>(text, "Agent V: Vision Analysis");

  // ── Save to cache (fire-and-forget) ──────────────────────────────────
  supabase.from("vision_cache").upsert({
    cache_key: cacheKey,
    result: parsed,
    analyzed_count: fetched.length,
  }).then(({ error }) => {
    if (error) console.error("[AgentV] cache save failed:", error.message);
  });

  return { ...parsed, analyzedCount: fetched.length };
}

// ── CTR deduplication: nudge duplicate scores by +0.1 until all 6 are unique ──
function deduplicateCTR(copies: AdCopy[]): AdCopy[] {
  const seen = new Set<number>();
  return copies.map((copy) => {
    let ctr = Math.round((copy.expectedCTR ?? 5.0) * 10) / 10;
    while (seen.has(ctr)) ctr = Math.round((ctr + 0.1) * 10) / 10;
    seen.add(ctr);
    return { ...copy, expectedCTR: ctr };
  });
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
      const rankLabel = g.chartRank
        ? `Google TOP ${g.chartRank}위`
        : g.iosChartRank
          ? `iOS TOP ${g.iosChartRank}위`
          : "인기 게임";
      const changeLabel = (g.rankChange ?? g.iosRankChange ?? 0) > 0
        ? ` (▲${g.rankChange ?? g.iosRankChange} 급상승)`
        : (g.rankChange ?? g.iosRankChange ?? 0) < 0
          ? ` (▼${Math.abs((g.rankChange ?? g.iosRankChange)!)} 하락)`
          : "";
      return `- appId: ${g.appId} | ${g.title} [${rankLabel}${changeLabel}] | Genre: ${g.genre} | Developer: ${g.developer}\n  Description: ${g.description.slice(0, 200)}`;
    })
    .join("\n");

  const message = await client.messages.create({
    model: HAIKU,
    max_tokens: 1800,
    system: "Mobile game market analyst. Explain WHY each game is popular in app store charts (Google Play or iOS App Store). Be specific — cover gameplay hook, social mechanics, monetization fit. Output raw JSON only.",
    messages: [{
      role: "user",
      content: `These games are currently charting:\n\n${gameList}\n\n${LANG_INSTRUCTION[lang] ?? LANG_INSTRUCTION.EN}\nFor each game, write 2-3 sentences explaining why it's charting. Cover whichever of these apply: core gameplay hook, retention driver, social/viral mechanic (skip if not applicable), monetization fit, and why it resonates with today's audience. Only mention what actually applies to that specific game.\n\nRespond with JSON:\n{\n  "insights": [\n    { "appId": "com.example", "reason": "..." }\n  ]\n}`,
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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 1분 후 다시 시도해주세요." }, { status: 429 });
  }

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

        // ── Stage 1: Trend Analysis + Why Chart + Vision (parallel) ──
        // Prefer chart game whose title matches the search query; fall back to highest rank
        const allChartGames = (games as GameData[])
          .filter((g) => g.chartRank != null || g.iosChartRank != null)
          .sort((a, b) => (a.chartRank ?? a.iosChartRank ?? 99) - (b.chartRank ?? b.iosChartRank ?? 99));
        const queryLower = query.toLowerCase();
        const matchedChartGame = allChartGames.find(
          (g) => g.title.toLowerCase().includes(queryLower) || queryLower.includes(g.title.toLowerCase())
        );
        const chartGames = matchedChartGame ? [matchedChartGame] : allChartGames.slice(0, 1);
        const [trendAnalysis, risingInsights, visionResult] = await Promise.all([
          analyzeTrends(games as GameData[], lang),
          chartGames.length > 0 ? analyzeWhyChart(chartGames, lang) : Promise.resolve([]),
          analyzeVision(games as GameData[], lang).catch(() => null),
        ]);
        send({ event: "analysis_done", message: "트렌드 분석 완료 (Sonnet)" });

        // Build vision context string to enrich downstream prompts
        // Abbreviated to key phrases only — saves ~140 tokens × 4 agents vs full sentences
        const visionContext = visionResult
          ? `\n\nVision(${visionResult.analyzedCount} screens): interaction=${visionResult.coreInteraction.split(".")[0]}; hook=${visionResult.visualHook.split(".")[0]}; colors=${visionResult.colorPalette.split(",").slice(0, 2).join(",")}; ui=${visionResult.uiComplexity}/5; elements=${visionResult.keyVisualElements.slice(0, 3).join(", ")}`
          : undefined;

        // ── Stage 2: Insight Ensemble (2x Haiku, parallel) ────────────
        const [insightA, insightB] = await Promise.all([
          summarizeInsightsAnalytical(trendAnalysis, lang, visionContext),
          summarizeInsightsCreative(trendAnalysis, lang, visionContext),
        ]);
        send({ event: "insights_ensemble_done", message: "인사이트 앙상블 완료 (Haiku ×2)" });

        // ── Orchestrator: Synthesize best insight (Sonnet) ─────────────
        const insight = await synthesizeInsight(insightA, insightB, lang);

        // ── Stage 3 prep: fetch tone preference history for this genre ──
        const topGenre = (games as GameData[])[0]?.genre ?? "";
        let preferenceContext: string | undefined;
        if (topGenre) {
          try {
            const { data: prefRows } = await import("@/lib/supabase").then(({ supabase }) =>
              supabase
                .from("copy_preferences")
                .select("preferred_tone")
                .ilike("genre", `%${topGenre}%`)
                .order("created_at", { ascending: false })
                .limit(50)
            );
            if (prefRows && prefRows.length >= 3) {
              const counts: Record<string, number> = {};
              for (const r of prefRows) counts[r.preferred_tone] = (counts[r.preferred_tone] ?? 0) + 1;
              const summary = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([tone, count]) => `${tone}(${count})`)
                .join(", ");
              preferenceContext = `\n\nUser preference history for ${topGenre} genre: ${summary}. Reflect this in CTR scoring and copy tone emphasis.`;
            }
          } catch { /* non-critical */ }
        }

        // ── Stage 3: Ad Copy Ensemble (2x Haiku, parallel) ────────────
        const [copiesA, copiesB] = await Promise.all([
          generateAdCopiesPerformance(insight, query, lang, visionContext, preferenceContext),
          generateAdCopiesBrand(insight, query, lang, visionContext, preferenceContext),
        ]);
        send({ event: "copies_ensemble_done", message: "광고 소재 앙상블 완료 (Haiku ×2)" });

        // ── Orchestrator: Select best ad copies (Sonnet) ───────────────
        const adCopies = deduplicateCTR(await synthesizeAdCopies(copiesA, copiesB, query, lang));

        const result: AnalysisResult = {
          query,
          games: games as GameData[],
          trendAnalysis,
          insight,
          adCopies,
          risingInsights: risingInsights.length > 0 ? risingInsights : undefined,
          visionResult: visionResult ?? null,
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
