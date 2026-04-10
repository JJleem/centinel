import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require("app-store-scraper");

type Tab = "rising" | "global" | "casual" | "ios-global" | "ios-grossing";

const GOOGLE_TAB_CONFIG: Record<string, { collection: string; category: string }> = {
  rising: { collection: "GROSSING",  category: "GAME"        },
  global: { collection: "TOP_FREE",  category: "GAME"        },
  casual: { collection: "TOP_FREE",  category: "GAME_CASUAL" },
};

const IOS_TAB_CONFIG: Record<string, { collection: string; category: number; label: string }> = {
  "ios-global":   { collection: store.collection.TOP_FREE_IOS,     category: store.category.GAMES,       label: "iOS 글로벌탑" },
  "ios-grossing": { collection: store.collection.TOP_GROSSING_IOS, category: store.category.GAMES,       label: "iOS 매출탑"   },
  "ios-casual":   { collection: store.collection.TOP_FREE_IOS,     category: store.category.GAMES_ARCADE, label: "iOS 캐주얼탑" },
};

export interface ChartGame {
  title: string;
  appId: string;
  developer: string;
  score: number;
  icon: string;
  genre: string;
  platform: "google" | "ios";
}

export async function GET(req: NextRequest) {
  const tab = (req.nextUrl.searchParams.get("tab") ?? "global") as Tab;
  const now = new Date().toISOString();

  // ── iOS tabs ─────────────────────────────────────────────────────────
  if (tab in IOS_TAB_CONFIG) {
    const config = IOS_TAB_CONFIG[tab];
    try {
      const results = await store.list({
        collection: config.collection,
        category:   config.category,
        num:        30,
        country:    "us",
      });

      // list() doesn't include score — fetch app details in parallel to get ratings
      type ListItem = { title?: string; id?: number; developer?: string; icon?: string; primaryGenreName?: string };
      type AppDetail = { score?: number };
      const scoreResults = await Promise.allSettled(
        results.map((app: ListItem) => store.app({ id: app.id, country: "us" }))
      );
      const scoreMap = new Map<number, number>(
        results.map((app: ListItem, i: number) => {
          const detail = scoreResults[i];
          const score = detail.status === "fulfilled" ? ((detail.value as AppDetail).score ?? 0) : 0;
          return [app.id ?? 0, score];
        })
      );

      const games: ChartGame[] = results.map((app: ListItem) => ({
        title:     app.title ?? "Unknown",
        appId:     String(app.id ?? ""),
        developer: app.developer ?? "Unknown",
        score:     scoreMap.get(app.id ?? 0) ?? 0,
        icon:      app.icon ?? "",
        genre:     app.primaryGenreName ?? "Game",
        platform:  "ios" as const,
      }));

      // Save snapshot (fire-and-forget)
      supabase.from("chart_snapshots").insert(
        games.map((g, i) => ({
          app_id:     g.appId,
          bundle_id:  g.appId,
          title:      g.title,
          developer:  g.developer,
          rank:       i + 1,
          collection: config.label,
          category:   "GAME_IOS",
          score:      g.score,
          icon:       g.icon,
          genre:      g.genre,
          platform:   "ios",
          fetched_at: now,
        }))
      ).then(({ error }) => {
        if (error) console.error("[charts] iOS snapshot save failed:", error.message);
      });

      return NextResponse.json({ games });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("[charts] iOS fetch failed:", err.message);
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }
  }

  // ── Google Play tabs ──────────────────────────────────────────────────
  const config = GOOGLE_TAB_CONFIG[tab] ?? GOOGLE_TAB_CONFIG.global;
  try {
    const results = await gplay.list({
      collection: config.collection,
      category:   config.category,
      num:        30,
      lang:       "en",
      country:    "us",
    });

    const games: ChartGame[] = results.map((app: {
      title?: string; appId?: string; developer?: string; score?: number; icon?: string; genre?: string;
    }) => ({
      title:     app.title ?? "Unknown",
      appId:     app.appId ?? "",
      developer: app.developer ?? "Unknown",
      score:     app.score ?? 0,
      icon:      app.icon ?? "",
      genre:     app.genre ?? "Game",
      platform:  "google" as const,
    }));

    // Save snapshot (fire-and-forget)
    supabase.from("chart_snapshots").insert(
      games.map((g, i) => ({
        app_id:     g.appId,
        bundle_id:  g.appId,
        title:      g.title,
        developer:  g.developer,
        rank:       i + 1,
        collection: config.collection,
        category:   config.category,
        score:      g.score,
        icon:       g.icon,
        genre:      g.genre,
        platform:   "google",
        fetched_at: now,
      }))
    ).then(({ error }) => {
      if (error) console.error("[charts] snapshot save failed:", error.message);
    });

    return NextResponse.json({ games });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[charts] Failed to fetch:", err.message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
