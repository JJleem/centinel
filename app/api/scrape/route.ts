import { NextRequest, NextResponse } from "next/server";
import { GameData, ScrapeResponse } from "@/types";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;

function normalizeInstalls(installs: string | number | undefined): string {
  if (!installs) return "N/A";
  if (typeof installs === "number") return `${installs.toLocaleString()}+`;
  return String(installs);
}

export async function POST(req: NextRequest) {
  const { query, appId } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const searchResults = await gplay.search({
      term: query,
      num: 10,
      lang: "en",
      country: "us",
      fullDetail: true,
    });

    // If appId provided (from chart click) and search returns < 3 GAME results,
    // fetch the app itself + similar games to pad results
    let rawResults = searchResults;
    if (appId && searchResults.filter((a: { genreId?: string }) => a.genreId?.startsWith("GAME")).length < 3) {
      try {
        const [appDetail, similar] = await Promise.allSettled([
          gplay.app({ appId, lang: "en", country: "us" }),
          gplay.similar({ appId, lang: "en", country: "us", fullDetail: true }),
        ]);
        const existingIds = new Set(searchResults.map((a: { appId?: string }) => a.appId));
        const extras: unknown[] = [];
        if (appDetail.status === "fulfilled" && !existingIds.has(appDetail.value?.appId)) {
          extras.push(appDetail.value);
          existingIds.add(appDetail.value?.appId);
        }
        if (similar.status === "fulfilled") {
          for (const a of similar.value) {
            if (!existingIds.has((a as { appId?: string }).appId)) extras.push(a);
          }
        }
        rawResults = [...searchResults, ...extras];
      } catch { /* fallback to search results */ }
    }

    const results = rawResults;

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
      // Enrich with rankChange from DB (non-critical)
      try {
        const appIds = games.map((g) => g.appId);

        // Get two most recent distinct snapshot times
        const { data: times } = await supabase
          .from("chart_snapshots")
          .select("fetched_at")
          .eq("collection", "TOP_FREE")
          .eq("category", "GAME")
          .order("fetched_at", { ascending: false })
          .limit(200);

        if (times && times.length > 0) {
          const latest = times[0].fetched_at;
          const latestDate = new Date(latest);
          const previous = times.find(
            (t) => new Date(t.fetched_at).getTime() < latestDate.getTime() - 60 * 60 * 1000
          );

          // Always get latest ranks (chartRank)
          const { data: newSnap } = await supabase
            .from("chart_snapshots")
            .select("app_id, rank")
            .eq("fetched_at", latest)
            .in("app_id", appIds);

          if (newSnap) {
            const newRankMap = new Map(newSnap.map((r) => [r.app_id, r.rank]));

            // Get previous snapshot if available (for rankChange)
            let oldRankMap = new Map<string, number>();
            if (previous) {
              const { data: oldSnap } = await supabase
                .from("chart_snapshots")
                .select("app_id, rank")
                .eq("fetched_at", previous.fetched_at)
                .in("app_id", appIds);
              if (oldSnap) oldRankMap = new Map(oldSnap.map((r) => [r.app_id, r.rank]));
            }

            for (const game of games) {
              const newRank = newRankMap.get(game.appId);
              if (newRank != null) {
                game.chartRank = newRank;
                const oldRank = oldRankMap.get(game.appId);
                if (oldRank != null) {
                  game.rankChange = oldRank - newRank;
                } else if (previous) {
                  game.rankChange = 10; // new entry since last snapshot
                }
              }
            }
          }
        }
      } catch { /* non-critical */ }

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
