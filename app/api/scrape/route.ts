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
  const { query, appId, chartRank, chartLabel } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    // Search without fullDetail to avoid 404 crashes from individual apps
    const searchList = await gplay.search({
      term: query,
      num: 10,
      lang: "en",
      country: "us",
    });

    // Fetch full details per-app in parallel, ignoring individual 404s
    const detailResults = await Promise.allSettled(
      searchList.map((r: { appId: string }) =>
        gplay.app({ appId: r.appId, lang: "en", country: "us" })
      )
    );
    let rawResults: unknown[] = detailResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    // If appId provided (from chart click) and still < 3 GAME results,
    // fetch the app itself + similar games to pad results
    if (appId && rawResults.filter((a) => (a as { genreId?: string }).genreId?.startsWith("GAME")).length < 3) {
      const existingIds = new Set(rawResults.map((a) => (a as { appId?: string }).appId));
      const [appDetail, similar] = await Promise.allSettled([
        gplay.app({ appId, lang: "en", country: "us" }),
        gplay.similar({ appId, lang: "en", country: "us" }),
      ]);
      if (appDetail.status === "fulfilled" && !existingIds.has(appDetail.value?.appId)) {
        rawResults = [appDetail.value, ...rawResults];
        existingIds.add(appDetail.value?.appId);
      }
      if (similar.status === "fulfilled") {
        const extras = (similar.value as { appId?: string }[]).filter((a) => !existingIds.has(a.appId));
        const detailedExtras = await Promise.allSettled(
          extras.slice(0, 15).map((a) => gplay.app({ appId: a.appId, lang: "en", country: "us" }))
        );
        rawResults = [
          ...rawResults,
          ...detailedExtras.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<unknown>).value),
        ];
      }
    }

    type RawApp = {
      title?: string; appId?: string; developer?: string; score?: number;
      installs?: string | number; genre?: string; genreId?: string;
      summary?: string; description?: string; icon?: string; screenshots?: string[];
    };
    const games: GameData[] = (rawResults as RawApp[])
      .filter((app) => app.genreId?.startsWith("GAME"))
      .map((app) => ({
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
      // If chart click provided rank directly, apply it to the matched game first
      if (appId && chartRank != null && chartLabel) {
        const matched = games.find((g) => g.appId === appId);
        if (matched) {
          matched.chartRank = chartRank;
          matched.chartLabel = chartLabel;
        }
      }

      // Enrich with chartRank/chartLabel/rankChange from DB (non-critical)
      try {
        const appIds = games.map((g) => g.appId);

        const CHARTS = [
          { collection: "TOP_FREE",  category: "GAME",         label: "글로벌탑" },
          { collection: "GROSSING",  category: "GAME",         label: "매출탑"   },
          { collection: "TOP_FREE",  category: "GAME_CASUAL",  label: "캐주얼탑" },
        ];

        for (const chart of CHARTS) {
          // Get two most recent distinct snapshot times for this chart
          const { data: times } = await supabase
            .from("chart_snapshots")
            .select("fetched_at")
            .eq("collection", chart.collection)
            .eq("category", chart.category)
            .order("fetched_at", { ascending: false })
            .limit(200);

          if (!times || times.length === 0) continue;

          const latest = times[0].fetched_at;
          const latestDate = new Date(latest);
          const previous = times.find(
            (t) => new Date(t.fetched_at).getTime() < latestDate.getTime() - 60 * 60 * 1000
          );

          const { data: newSnap } = await supabase
            .from("chart_snapshots")
            .select("app_id, rank")
            .eq("collection", chart.collection)
            .eq("category", chart.category)
            .eq("fetched_at", latest)
            .in("app_id", appIds);

          if (!newSnap) continue;
          const newRankMap = new Map(newSnap.map((r) => [r.app_id, r.rank]));

          let oldRankMap = new Map<string, number>();
          if (previous) {
            const { data: oldSnap } = await supabase
              .from("chart_snapshots")
              .select("app_id, rank")
              .eq("collection", chart.collection)
              .eq("category", chart.category)
              .eq("fetched_at", previous.fetched_at)
              .in("app_id", appIds);
            if (oldSnap) oldRankMap = new Map(oldSnap.map((r) => [r.app_id, r.rank]));
          }

          for (const game of games) {
            const newRank = newRankMap.get(game.appId);
            if (newRank != null && game.chartRank == null) {
              // First chart that matches wins (priority: 글로벌탑 > 매출탑 > 캐주얼탑)
              game.chartRank = newRank;
              game.chartLabel = chart.label;
              const oldRank = oldRankMap.get(game.appId);
              if (oldRank != null) {
                game.rankChange = oldRank - newRank;
              } else if (previous) {
                game.rankChange = 10;
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
