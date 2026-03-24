import { NextRequest, NextResponse } from "next/server";
import fallbackData from "@/data/fallback.json";
import { GameData, ScrapeResponse } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;

function normalizeInstalls(installs: string | number | undefined): string {
  if (!installs) return "N/A";
  if (typeof installs === "number") return `${installs.toLocaleString()}+`;
  return String(installs);
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const results = await gplay.search({
      term: query,
      num: 10,
      lang: "en",
      country: "us",
      fullDetail: false,
    });

    const games: GameData[] = results.map(
      (app: {
        title?: string;
        appId?: string;
        developer?: string;
        score?: number;
        installs?: string | number;
        genre?: string;
        summary?: string;
        description?: string;
        icon?: string;
      }) => ({
        title: app.title ?? "Unknown",
        appId: app.appId ?? "",
        developer: app.developer ?? "Unknown",
        score: app.score ?? 0,
        installs: normalizeInstalls(app.installs),
        genre: app.genre ?? "Casual",
        description: app.summary ?? app.description ?? "",
        icon: app.icon ?? "",
      })
    );

    if (games.length >= 3) {
      const response: ScrapeResponse = { games, source: "scrape", usedFallback: false };
      return NextResponse.json(response);
    }
    console.warn(`[scrape] Only ${games.length} results for "${query}", using fallback`);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.warn("[scrape] Google Play scraping failed, using fallback data");
    console.log("[scrape] Error details:", err.message, err.code);
  }

  const response: ScrapeResponse = {
    games: fallbackData as GameData[],
    source: "fallback",
    usedFallback: true,
  };
  return NextResponse.json(response);
}
