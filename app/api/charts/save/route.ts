import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;

const TABS = [
  { collection: "TOP_FREE", category: "GAME" },
  { collection: "GROSSING", category: "GAME" },
  { collection: "TOP_FREE", category: "GAME_CASUAL" },
];

export async function POST() {
  const fetchedAt = new Date().toISOString();
  const results: { collection: string; category: string; count: number }[] = [];

  for (const tab of TABS) {
    try {
      const games = await gplay.list({
        collection: tab.collection,
        category: tab.category,
        num: 30,
        lang: "en",
        country: "us",
      });

      const rows = games.map((app: { title?: string; appId?: string; developer?: string; score?: number; icon?: string; genre?: string }, i: number) => ({
        app_id: app.appId ?? "",
        title: app.title ?? "Unknown",
        developer: app.developer ?? "Unknown",
        rank: i + 1,
        collection: tab.collection,
        category: tab.category,
        score: app.score ?? 0,
        icon: app.icon ?? "",
        genre: app.genre ?? "Game",
        fetched_at: fetchedAt,
      }));

      const { error } = await supabase.from("chart_snapshots").insert(rows);
      if (error) throw new Error(error.message);

      results.push({ ...tab, count: rows.length });
    } catch (err) {
      console.error(`[save] Failed for ${tab.collection}/${tab.category}:`, err);
      results.push({ ...tab, count: -1, error: String(err) });
    }
  }

  const anyFailed = results.some((r) => r.count === -1);
  return NextResponse.json(
    { ok: !anyFailed, fetchedAt, results },
    { status: anyFailed ? 500 : 200 }
  );
}
