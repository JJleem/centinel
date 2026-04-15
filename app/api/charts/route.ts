import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require("app-store-scraper");

type Tab = "rising" | "global" | "casual" | "ios-global" | "ios-grossing" | "ios-casual";

export interface ChartGame {
  title: string;
  appId: string;
  developer: string;
  score: number;
  icon: string;
  genre: string;
  platform: "google" | "ios";
  rank?: number;
}

// DB collection/category mapping per tab
const DB_CONFIG: Record<Tab, { collection: string; category: string; platform: "google" | "ios" }> = {
  global:        { collection: "TOP_FREE",    category: "GAME",        platform: "google" },
  rising:        { collection: "GROSSING",    category: "GAME",        platform: "google" },
  casual:        { collection: "TOP_FREE",    category: "GAME_CASUAL", platform: "google" },
  "ios-global":   { collection: "iOS 글로벌탑", category: "GAME_IOS",   platform: "ios"    },
  "ios-grossing": { collection: "iOS 매출탑",   category: "GAME_IOS",   platform: "ios"    },
  "ios-casual":   { collection: "iOS 캐주얼탑", category: "GAME_IOS",   platform: "ios"    },
};

// Live-fetch fallback config
const GOOGLE_LIVE: Record<string, { collection: string; category: string }> = {
  global: { collection: "TOP_FREE", category: "GAME"        },
  rising: { collection: "GROSSING", category: "GAME"        },
  casual: { collection: "TOP_FREE", category: "GAME_CASUAL" },
};
const IOS_LIVE: Record<string, { collection: string; category: number; label: string }> = {
  "ios-global":   { collection: store.collection.TOP_FREE_IOS,     category: store.category.GAMES,        label: "iOS 글로벌탑" },
  "ios-grossing": { collection: store.collection.TOP_GROSSING_IOS, category: store.category.GAMES,        label: "iOS 매출탑"   },
  "ios-casual":   { collection: store.collection.TOP_FREE_IOS,     category: store.category.GAMES_ARCADE, label: "iOS 캐주얼탑" },
};

export async function GET(req: NextRequest) {
  const tab = (req.nextUrl.searchParams.get("tab") ?? "global") as Tab;
  const dbCfg = DB_CONFIG[tab];
  const now   = new Date().toISOString();

  // ── 1. Try DB (latest snapshot within 2 hours) ─────────────────────────
  if (dbCfg) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: latestRow } = await supabase
      .from("chart_snapshots")
      .select("fetched_at")
      .eq("collection", dbCfg.collection)
      .eq("category",   dbCfg.category)
      .eq("platform",   dbCfg.platform)
      .gte("fetched_at", twoHoursAgo)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    if (latestRow) {
      const { data: rows } = await supabase
        .from("chart_snapshots")
        .select("app_id, title, developer, rank, score, icon, genre")
        .eq("collection", dbCfg.collection)
        .eq("category",   dbCfg.category)
        .eq("platform",   dbCfg.platform)
        .eq("fetched_at", latestRow.fetched_at)
        .order("rank",    { ascending: true });

      // 100개 미만이면 구 데이터(30개짜리) — 라이브 페치로 fall through
      if (rows && rows.length >= 100) {
        const games: ChartGame[] = rows.map((r) => ({
          title:     r.title     ?? "Unknown",
          appId:     r.app_id   ?? "",
          developer: r.developer ?? "Unknown",
          score:     r.score    ?? 0,
          icon:      r.icon     ?? "",
          genre:     r.genre    ?? "Game",
          platform:  dbCfg.platform,
          rank:      r.rank,
        }));
        return NextResponse.json({ games, fetchedAt: latestRow.fetched_at });
      }
    }
  }

  // ── 2. Live-fetch fallback (DB empty / stale) ──────────────────────────

  // iOS live fallback (limit 30 — individual score fetches are slow)
  if (tab in IOS_LIVE) {
    const config = IOS_LIVE[tab];
    try {
      const results = await store.list({ collection: config.collection, category: config.category, num: 30, country: "us" });

      type ListItem = { title?: string; id?: number; developer?: string; icon?: string; primaryGenreName?: string };
      type AppDetail = { score?: number };
      const scoreResults = await Promise.allSettled(
        results.map((app: ListItem) => store.app({ id: app.id, country: "us" }))
      );
      const scoreMap = new Map<number, number>(
        results.map((app: ListItem, i: number) => {
          const d = scoreResults[i];
          return [app.id ?? 0, d.status === "fulfilled" ? ((d.value as AppDetail).score ?? 0) : 0];
        })
      );
      const games: ChartGame[] = results.map((app: ListItem, i: number) => ({
        title:     app.title ?? "Unknown",
        appId:     String(app.id ?? ""),
        developer: app.developer ?? "Unknown",
        score:     scoreMap.get(app.id ?? 0) ?? 0,
        icon:      app.icon ?? "",
        genre:     app.primaryGenreName ?? "Game",
        platform:  "ios" as const,
        rank:      i + 1,
      }));

      supabase.from("chart_snapshots").insert(
        games.map((g) => ({
          app_id: g.appId, bundle_id: g.appId, title: g.title, developer: g.developer,
          rank: g.rank, collection: config.label, category: "GAME_IOS",
          score: g.score, icon: g.icon, genre: g.genre, platform: "ios", fetched_at: now,
        }))
      ).then(({ error }) => { if (error) console.error("[charts] iOS snapshot save failed:", error.message); });

      return NextResponse.json({ games });
    } catch (err) {
      console.error("[charts] iOS live fetch failed:", (err as { message?: string }).message);
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }
  }

  // Google live fallback
  const googleCfg = GOOGLE_LIVE[tab] ?? GOOGLE_LIVE.global;
  try {
    const results = await gplay.list({ collection: googleCfg.collection, category: googleCfg.category, num: 200, lang: "en", country: "us" });

    const games: ChartGame[] = results.map((app: {
      title?: string; appId?: string; developer?: string; score?: number; icon?: string; genre?: string;
    }, i: number) => ({
      title:     app.title     ?? "Unknown",
      appId:     app.appId    ?? "",
      developer: app.developer ?? "Unknown",
      score:     app.score    ?? 0,
      icon:      app.icon     ?? "",
      genre:     app.genre    ?? "Game",
      platform:  "google" as const,
      rank:      i + 1,
    }));

    supabase.from("chart_snapshots").insert(
      games.map((g) => ({
        app_id: g.appId, bundle_id: g.appId, title: g.title, developer: g.developer,
        rank: g.rank, collection: googleCfg.collection, category: googleCfg.category,
        score: g.score, icon: g.icon, genre: g.genre, platform: "google", fetched_at: now,
      }))
    ).then(({ error }) => { if (error) console.error("[charts] snapshot save failed:", error.message); });

    return NextResponse.json({ games });
  } catch (err) {
    console.error("[charts] Google live fetch failed:", (err as { message?: string }).message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
