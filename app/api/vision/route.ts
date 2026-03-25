import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GameData, VisionResult } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SONNET = "claude-sonnet-4-20250514";

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mediaType: ImageMediaType } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const validTypes: ImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mediaType: ImageMediaType = validTypes.find((t) => contentType.includes(t)) ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { data, mediaType };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  const { games, lang = "KO" } = await req.json() as { games: GameData[]; lang?: string };

  if (!games || !Array.isArray(games)) {
    return NextResponse.json({ error: "games array is required" }, { status: 400 });
  }

  // Collect one screenshot per game (first available)
  const imageJobs = games
    .map((g) => ({ title: g.title, url: g.screenshots?.[0] ?? null }))
    .filter((j): j is { title: string; url: string } => j.url !== null);

  if (imageJobs.length === 0) {
    return NextResponse.json(
      { error: "스크린샷 URL이 없습니다. 분석할 이미지를 찾을 수 없습니다." },
      { status: 422 }
    );
  }

  // Fetch images in parallel, skip failures
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* client disconnected */ }
      };

      try {
        const progressMsg = lang === "KO" ? "이미지 다운로드 중..." : "Downloading images...";
        send({ event: "progress", message: progressMsg, count: 0, total: imageJobs.length });

        const fetched: { title: string; data: string; mediaType: ImageMediaType }[] = [];
        for (let i = 0; i < imageJobs.length; i++) {
          const job = imageJobs[i];
          const result = await fetchImageAsBase64(job.url);
          if (result) fetched.push({ title: job.title, ...result });
          send({ event: "progress", message: progressMsg, count: i + 1, total: imageJobs.length });
        }

        if (fetched.length < 3) {
          const errMsg = lang === "KO"
            ? `스크린샷 분석 불가: 유효한 이미지가 ${fetched.length}개뿐입니다 (최소 3개 필요)`
            : `Cannot analyze: only ${fetched.length} valid image(s) (minimum 3 required)`;
          send({ error: errMsg });
          controller.close();
          return;
        }

        const analyzingMsg = lang === "KO"
          ? `${fetched.length}개 이미지 Claude Vision 분석 중...`
          : `Analyzing ${fetched.length} images with Claude Vision...`;
        send({ event: "analyzing", message: analyzingMsg });

        // Build content blocks: text prompt + images
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

Analyze these screenshots and identify patterns across all games. Be thorough and specific — reference actual visual details you observe.

1. Core interaction mechanic (tap/swipe/drag/tilt — most common across games, explain briefly how it works)
2. Visual hook in first 3 seconds (specific elements that grab attention immediately — colors, motion cues, UI prompts)
3. Color palette and mood (dominant 3-4 colors, emotional tone, brightness level)
4. UI complexity level (1=extremely simple/one button, 5=complex/many elements — give the number and explain why)
5. Key visual elements that drive engagement (3-5 specific elements observed, e.g. progress bars, character expressions, particle effects)

${langInstruction}
Output raw JSON only — no markdown, no code blocks:
{
  "coreInteraction": "2-3 sentence description of the dominant mechanic with specific details",
  "visualHook": "2-3 sentence description of visual hook with specific details",
  "colorPalette": "specific colors observed and the emotional mood they create",
  "uiComplexity": 2,
  "keyVisualElements": ["specific element 1", "specific element 2", "specific element 3", "specific element 4"]
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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Vision API returned invalid JSON");

        const parsed = JSON.parse(jsonMatch[0]) as Omit<VisionResult, "analyzedCount">;
        const result: VisionResult = { ...parsed, analyzedCount: fetched.length };

        send({ event: "done", result });
      } catch (error) {
        console.error("[vision] Error:", error);
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
