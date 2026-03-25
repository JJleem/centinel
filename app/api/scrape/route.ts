import { NextRequest, NextResponse } from "next/server";
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
      fullDetail: true,
    });

    const games: GameData[] = results
      .filter((app: { genreId?: string }) => app.genreId?.startsWith("GAME"))
      .map(
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
          screenshots?: string[];
        }) => ({
          title: app.title ?? "Unknown",
          appId: app.appId ?? "",
          developer: app.developer ?? "Unknown",
          score: app.score ?? 0,
          installs: normalizeInstalls(app.installs),
          genre: app.genre ?? "Casual",
          description: app.summary ?? app.description ?? "",
          icon: app.icon ?? "",
          screenshots: (app.screenshots ?? []).slice(0, 3),
        })
      );

    if (games.length >= 3) {
      const response: ScrapeResponse = { games, source: "scrape", usedFallback: false };
      return NextResponse.json(response);
    }

    console.warn(`[scrape] Only ${games.length} results for "${query}"`);
    return NextResponse.json(
      { error: "insufficient_results" },
      { status: 422 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.warn("[scrape] Google Play scraping failed:", err.message, err.code);
    return NextResponse.json(
      { error: "insufficient_results" },
      { status: 422 }
    );
  }
}
