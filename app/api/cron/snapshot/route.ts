import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gplay = require("google-play-scraper").default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require("app-store-scraper");

const GOOGLE_TABS = [
  { collection: "TOP_FREE", category: "GAME",        label: "글로벌탑" },
  { collection: "GROSSING", category: "GAME",        label: "매출탑"   },
  { collection: "TOP_FREE", category: "GAME_CASUAL", label: "캐주얼탑" },
];

const IOS_TABS = [
  { collection: store.collection.TOP_FREE_IOS,     category: store.category.GAMES,        label: "iOS 글로벌탑" },
  { collection: store.collection.TOP_GROSSING_IOS, category: store.category.GAMES,        label: "iOS 매출탑"   },
  { collection: store.collection.TOP_FREE_IOS,     category: store.category.GAMES_ARCADE, label: "iOS 캐주얼탑" },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fetchedAt = new Date().toISOString();
  const results: { platform: string; collection: string; category: string; count: number }[] = [];

  // ── Google Play snapshots ──────────────────────────────────────────────
  for (const tab of GOOGLE_TABS) {
    try {
      const games = await gplay.list({
        collection: tab.collection,
        category: tab.category,
        num: 30,
        lang: "en",
        country: "us",
      });

      const rows = games.map((app: { title?: string; appId?: string; developer?: string; score?: number; icon?: string; genre?: string }, i: number) => ({
        app_id:     app.appId ?? "",
        bundle_id:  app.appId ?? "",
        title:      app.title ?? "Unknown",
        developer:  app.developer ?? "Unknown",
        rank:       i + 1,
        collection: tab.collection,
        category:   tab.category,
        score:      app.score ?? 0,
        icon:       app.icon ?? "",
        genre:      app.genre ?? "Game",
        platform:   "google",
        fetched_at: fetchedAt,
      }));

      const { error } = await supabase.from("chart_snapshots").insert(rows);
      if (error) throw new Error(error.message);
      results.push({ platform: "google", ...tab, count: rows.length });
    } catch (err) {
      console.error(`[cron] Google ${tab.collection}/${tab.category} failed:`, err);
      results.push({ platform: "google", ...tab, count: -1 });
    }
  }

  // ── iOS App Store snapshots ────────────────────────────────────────────
  for (const tab of IOS_TABS) {
    try {
      const games = await store.list({
        collection: tab.collection,
        category:   tab.category,
        num:        30,
        country:    "us",
      });

      const rows = games.map((app: { title?: string; id?: number; appId?: string; developer?: string; score?: number; icon?: string; primaryGenreName?: string }, i: number) => ({
        app_id:     String(app.id ?? app.appId ?? ""),
        bundle_id:  String(app.id ?? app.appId ?? ""),
        title:      app.title ?? "Unknown",
        developer:  app.developer ?? "Unknown",
        rank:       i + 1,
        collection: tab.label,
        category:   "GAME_IOS",
        score:      app.score ?? 0,
        icon:       app.icon ?? "",
        genre:      app.primaryGenreName ?? "Game",
        platform:   "ios",
        fetched_at: fetchedAt,
      }));

      const { error } = await supabase.from("chart_snapshots").insert(rows);
      if (error) throw new Error(error.message);
      results.push({ platform: "ios", collection: tab.label, category: "GAME_IOS", count: rows.length });
    } catch (err) {
      console.error(`[cron] iOS ${tab.label} failed:`, err);
      results.push({ platform: "ios", collection: tab.label, category: "GAME_IOS", count: -1 });
    }
  }

  return NextResponse.json({ ok: true, fetchedAt, results });
}
