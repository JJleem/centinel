import { NextRequest, NextResponse } from "next/server";
import fallbackData from "@/data/fallback.json";
import { GameData, ScrapeResponse } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper");

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
      }) => ({
        title: app.title ?? "Unknown",
        appId: app.appId ?? "",
        developer: app.developer ?? "Unknown",
        score: app.score ?? 0,
        installs: normalizeInstalls(app.installs),
        genre: app.genre ?? "Casual",
        description: app.summary ?? app.description ?? "",
      })
    );

    const response: ScrapeResponse = { games, source: "scrape" };
    return NextResponse.json(response);
  } catch {
    console.warn("[scrape] Google Play scraping failed, using fallback data");
    const response: ScrapeResponse = {
      games: fallbackData as GameData[],
      source: "fallback",
    };
    return NextResponse.json(response);
  }
}
