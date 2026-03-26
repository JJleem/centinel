import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;

type Tab = "rising" | "global" | "casual";

const TAB_CONFIG: Record<Tab, { collection: string; category: string }> = {
  rising: { collection: "GROSSING", category: "GAME" },
  global: { collection: "TOP_FREE", category: "GAME" },
  casual: { collection: "TOP_FREE", category: "GAME_CASUAL" },
};

export interface ChartGame {
  title: string;
  appId: string;
  developer: string;
  score: number;
  icon: string;
  genre: string;
}

export async function GET(req: NextRequest) {
  const tab = (req.nextUrl.searchParams.get("tab") ?? "global") as Tab;
  const config = TAB_CONFIG[tab] ?? TAB_CONFIG.global;

  try {
    const results = await gplay.list({
      collection: config.collection,
      category: config.category,
      num: 30,
      lang: "en",
      country: "us",
    });

    const games: ChartGame[] = results.map(
      (app: {
        title?: string;
        appId?: string;
        developer?: string;
        score?: number;
        icon?: string;
        genre?: string;
      }) => ({
        title: app.title ?? "Unknown",
        appId: app.appId ?? "",
        developer: app.developer ?? "Unknown",
        score: app.score ?? 0,
        icon: app.icon ?? "",
        genre: app.genre ?? "Game",
      })
    );

    // Save snapshot to DB (fire-and-forget, non-critical)
    try {
      const snapshotRows = games.map((g, i) => ({
        app_id: g.appId,
        title: g.title,
        developer: g.developer,
        rank: i + 1,
        collection: config.collection,
        category: config.category,
        score: g.score,
        icon: g.icon,
        genre: g.genre,
        fetched_at: new Date().toISOString(),
      }));
      supabase.from("chart_snapshots").insert(snapshotRows).then(({ error: dbErr }) => {
        if (dbErr) console.error("[charts] snapshot save failed:", dbErr.message);
      });
    } catch (dbErr) {
      console.error("[charts] snapshot init error:", dbErr);
    }

    return NextResponse.json({ games });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[charts] Failed to fetch:", err.message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
