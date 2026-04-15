import { NextRequest, NextResponse } from "next/server";
import { GameData, ScrapeResponse } from "@/types";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require("app-store-scraper");

function normalizeInstalls(installs: string | number | undefined): string {
  if (!installs) return "N/A";
  if (typeof installs === "number") return `${installs.toLocaleString()}+`;
  return String(installs);
}

// Normalize title for matching: lowercase, strip special chars
function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type RawApp = {
  title?: string; appId?: string; developer?: string; score?: number;
  installs?: string | number; genre?: string; genreId?: string;
  summary?: string; description?: string; icon?: string; screenshots?: string[];
};

type RawIosApp = {
  title?: string; id?: number; appId?: string; developer?: string; score?: number;
  primaryGenreId?: number; primaryGenreName?: string;
  description?: string; icon?: string; screenshots?: string[];
};

// Fetch iOS search results + chart enrichment from DB
async function fetchIosData(query: string): Promise<{ iosGames: RawIosApp[]; iosChartMap: Map<string, { rank: number; label: string; rankChange: number }> }> {
  try {
    const results: RawIosApp[] = await store.search({ term: query, num: 10, country: "us" });
    const iosGames = results.filter((a) => a.primaryGenreId === 6014 || (a.primaryGenreName ?? "").toLowerCase().includes("game"));

    // Enrich with iOS chart data from DB
    const iosBundleIds = iosGames.map((a) => String(a.id ?? "")).filter(Boolean);
    const iosChartMap = new Map<string, { rank: number; label: string; rankChange: number }>();

    if (iosBundleIds.length > 0) {
      const IOS_CHARTS = [
        { label: "iOS 글로벌탑", collection: "iOS 글로벌탑", category: "GAME_IOS" },
        { label: "iOS 매출탑",   collection: "iOS 매출탑",   category: "GAME_IOS" },
      ];

      for (const chart of IOS_CHARTS) {
        const { data: times } = await supabase
          .from("chart_snapshots")
          .select("fetched_at")
          .eq("platform", "ios")
          .eq("collection", chart.collection)
          .order("fetched_at", { ascending: false })
          .limit(200);

        if (!times || times.length === 0) continue;

        const latest = times[0].fetched_at;
        const latestDate = new Date(latest);
        const previous = times.find(
          (t) => new Date(t.fetched_at).getTime() < latestDate.getTime() - 45 * 60 * 1000
        );

        const { data: newSnap } = await supabase
          .from("chart_snapshots")
          .select("app_id, rank")
          .eq("platform", "ios")
          .eq("collection", chart.collection)
          .eq("fetched_at", latest)
          .in("app_id", iosBundleIds);

        if (!newSnap) continue;
        const newRankMap = new Map(newSnap.map((r) => [r.app_id, r.rank]));

        let oldRankMap = new Map<string, number>();
        if (previous) {
          const { data: oldSnap } = await supabase
            .from("chart_snapshots")
            .select("app_id, rank")
            .eq("platform", "ios")
            .eq("collection", chart.collection)
            .eq("fetched_at", previous.fetched_at)
            .in("app_id", iosBundleIds);
          if (oldSnap) oldRankMap = new Map(oldSnap.map((r) => [r.app_id, r.rank]));
        }

        for (const id of iosBundleIds) {
          const newRank = newRankMap.get(id);
          if (newRank != null && !iosChartMap.has(id)) {
            const oldRank = oldRankMap.get(id);
            iosChartMap.set(id, {
              rank: newRank,
              label: chart.label,
              rankChange: oldRank != null ? oldRank - newRank : (previous ? 10 : 0),
            });
          }
        }
      }
    }

    return { iosGames, iosChartMap };
  } catch {
    return { iosGames: [], iosChartMap: new Map() };
  }
}

export async function POST(req: NextRequest) {
  const { query, appId, chartRank, chartLabel } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    // ── Google Play + iOS search in parallel ──────────────────────────────
    const [googleSearchResult, iosResult] = await Promise.allSettled([
      gplay.search({ term: query, num: 10, lang: "en", country: "us" }),
      fetchIosData(query),
    ]);

    // ── Google Play processing ────────────────────────────────────────────
    const searchList = googleSearchResult.status === "fulfilled" ? googleSearchResult.value : [];
    const detailResults = await Promise.allSettled(
      searchList.map((r: { appId: string }) =>
        gplay.app({ appId: r.appId, lang: "en", country: "us" })
      )
    );
    let rawResults: unknown[] = detailResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    let usedFallback = false;
    let fallbackGenre: string | undefined;

    if (appId && rawResults.filter((a) => (a as { genreId?: string }).genreId?.startsWith("GAME")).length < 3) {
      const existingIds = new Set(rawResults.map((a) => (a as { appId?: string }).appId));
      const [appDetail, similar] = await Promise.allSettled([
        gplay.app({ appId, lang: "en", country: "us" }),
        gplay.similar({ appId, lang: "en", country: "us" }),
      ]);
      if (appDetail.status === "fulfilled" && !existingIds.has(appDetail.value?.appId)) {
        rawResults = [appDetail.value, ...rawResults];
        existingIds.add(appDetail.value?.appId);
        fallbackGenre = (appDetail.value as RawApp).genre ?? (appDetail.value as RawApp).genreId ?? undefined;
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
        usedFallback = true;
      }
    }

    const games: GameData[] = (rawResults as RawApp[])
      .filter((app) => app.genreId?.startsWith("GAME"))
      .map((app) => ({
        title:       app.title ?? "Unknown",
        appId:       app.appId ?? "",
        developer:   app.developer ?? "Unknown",
        score:       app.score ?? 0,
        installs:    normalizeInstalls(app.installs),
        genre:       app.genre ?? "Casual",
        description: app.summary ?? app.description ?? "",
        icon:        app.icon ?? "",
        screenshots: (app.screenshots ?? []).slice(0, 3),
        platform:    "google" as const,
      }));

    if (games.length < 3) {
      console.warn(`[scrape] Only ${games.length} results for "${query}"`);
      return NextResponse.json({ error: "insufficient_results" }, { status: 422 });
    }

    // ── iOS matching & merge ──────────────────────────────────────────────
    const { iosGames, iosChartMap } = iosResult.status === "fulfilled"
      ? iosResult.value
      : { iosGames: [], iosChartMap: new Map() };

    for (const game of games) {
      const normalizedGoogle = normalizeTitle(game.title);
      const matched = iosGames.find((ios) => normalizeTitle(ios.title ?? "") === normalizedGoogle);
      if (matched) {
        const iosId = String(matched.id ?? "");
        const chartInfo = iosChartMap.get(iosId);
        game.platform       = "both";
        game.iosBundleId    = iosId;
        game.iosChartRank   = chartInfo?.rank;
        game.iosChartLabel  = chartInfo?.label;
        game.iosRankChange  = chartInfo?.rankChange;
      }
    }

    // ── Google chart enrichment from DB (existing logic) ─────────────────
    if (appId && chartRank != null && chartLabel) {
      const matched = games.find((g) => g.appId === appId);
      if (matched) {
        matched.chartRank  = chartRank;
        matched.chartLabel = chartLabel;
      }
    }

    try {
      const appIds = games.map((g) => g.appId);
      const CHARTS = [
        { collection: "TOP_FREE", category: "GAME",        label: "글로벌탑" },
        { collection: "GROSSING", category: "GAME",        label: "매출탑"   },
        { collection: "TOP_FREE", category: "GAME_CASUAL", label: "캐주얼탑" },
      ];

      for (const chart of CHARTS) {
        const { data: times } = await supabase
          .from("chart_snapshots")
          .select("fetched_at")
          .eq("collection", chart.collection)
          .eq("category", chart.category)
          .eq("platform", "google")
          .order("fetched_at", { ascending: false })
          .limit(200);

        if (!times || times.length === 0) continue;

        const latest = times[0].fetched_at;
        const latestDate = new Date(latest);
        const previous = times.find(
          (t) => new Date(t.fetched_at).getTime() < latestDate.getTime() - 45 * 60 * 1000
        );

        const { data: newSnap } = await supabase
          .from("chart_snapshots")
          .select("app_id, rank")
          .eq("collection", chart.collection)
          .eq("category", chart.category)
          .eq("platform", "google")
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
            .eq("platform", "google")
            .eq("fetched_at", previous.fetched_at)
            .in("app_id", appIds);
          if (oldSnap) oldRankMap = new Map(oldSnap.map((r) => [r.app_id, r.rank]));
        }

        for (const game of games) {
          const newRank = newRankMap.get(game.appId);
          if (newRank != null && game.chartRank == null) {
            game.chartRank  = newRank;
            game.chartLabel = chart.label;
            const oldRank   = oldRankMap.get(game.appId);
            game.rankChange = oldRank != null ? oldRank - newRank : (previous ? 10 : undefined);
          }
        }
      }
    } catch (e) {
      console.error("[scrape] chart enrichment failed:", e);
    }

    const response: ScrapeResponse = { games, source: "scrape", usedFallback, ...(fallbackGenre ? { fallbackGenre } : {}) };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.warn("[scrape] failed:", err.message, err.code);
    return NextResponse.json({ error: "insufficient_results" }, { status: 422 });
  }
}
