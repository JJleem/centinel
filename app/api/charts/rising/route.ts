import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Platform = "google" | "ios";

const PLATFORM_CONFIG: Record<Platform, { collection: string; category: string }> = {
  google: { collection: "TOP_FREE",    category: "GAME"     },
  ios:    { collection: "iOS 글로벌탑", category: "GAME_IOS" },  // iOS 글로벌탑 기준으로 급상승 계산
};

function buildRising(
  newSnap: { app_id: string; title: string; developer: string; rank: number; icon: string; score: number; genre: string }[],
  oldSnap: { app_id: string; rank: number }[]
) {
  const oldRankMap = new Map(oldSnap.map((g) => [g.app_id, g.rank]));
  return newSnap
    .map((g) => {
      const oldRank = oldRankMap.get(g.app_id);
      const isNewEntry = oldRank == null;
      const rankChange = isNewEntry ? 201 - g.rank : oldRank - g.rank;
      return { ...g, rankChange, isNewEntry };
    })
    .filter((g) => g.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 30)
    .map((g) => ({
      title:      g.title,
      appId:      g.app_id,
      developer:  g.developer,
      score:      g.score ?? 0,
      icon:       g.icon ?? "",
      genre:      g.genre ?? "Game",
      rankChange: g.rankChange,
      isNewEntry: g.isNewEntry,
    }));
}

export async function GET(req: NextRequest) {
  const platform = (req.nextUrl.searchParams.get("platform") ?? "google") as Platform;
  const config = PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.google;

  // Step 1: most recent snapshot time
  const { data: latestRow, error: latestErr } = await supabase
    .from("chart_snapshots")
    .select("fetched_at")
    .eq("collection", config.collection)
    .eq("category",   config.category)
    .eq("platform",   platform)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (latestErr || !latestRow) {
    return NextResponse.json({ error: "no_data" }, { status: 404 });
  }

  const latest     = latestRow.fetched_at;
  const latestDate = new Date(latest);

  // Step 2: previous snapshot (at least 1 hour older)
  const { data: previousRow } = await supabase
    .from("chart_snapshots")
    .select("fetched_at")
    .eq("collection", config.collection)
    .eq("category",   config.category)
    .eq("platform",   platform)
    .lt("fetched_at", new Date(latestDate.getTime() - 45 * 60 * 1000).toISOString())
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (!previousRow) {
    return NextResponse.json({ error: "insufficient_snapshots", latestSnapshotAt: latest }, { status: 202 });
  }

  const previous = previousRow.fetched_at;

  // Step 3: fetch both snapshots
  const [{ data: newSnap }, { data: oldSnap }] = await Promise.all([
    supabase
      .from("chart_snapshots")
      .select("app_id, title, developer, rank, icon, score, genre")
      .eq("collection", config.collection)
      .eq("category",   config.category)
      .eq("platform",   platform)
      .eq("fetched_at", latest),
    supabase
      .from("chart_snapshots")
      .select("app_id, rank")
      .eq("collection", config.collection)
      .eq("category",   config.category)
      .eq("platform",   platform)
      .eq("fetched_at", previous),
  ]);

  if (!newSnap || !oldSnap) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  let rising     = buildRising(newSnap, oldSnap);
  let comparedAt = previous;

  // 변동 없으면 가장 오래된 스냅샷과 비교
  if (rising.length === 0) {
    const { data: oldestRow } = await supabase
      .from("chart_snapshots")
      .select("fetched_at")
      .eq("collection", config.collection)
      .eq("category",   config.category)
      .eq("platform",   platform)
      .order("fetched_at", { ascending: true })
      .limit(1)
      .single();

    if (oldestRow && oldestRow.fetched_at !== previous) {
      const { data: oldestSnap } = await supabase
        .from("chart_snapshots")
        .select("app_id, rank")
        .eq("collection", config.collection)
        .eq("category",   config.category)
        .eq("platform",   platform)
        .eq("fetched_at", oldestRow.fetched_at);

      if (oldestSnap) {
        rising     = buildRising(newSnap, oldestSnap);
        comparedAt = oldestRow.fetched_at;
      }
    }
  }

  return NextResponse.json({
    games:               rising,
    snapshotAge:         Math.round((latestDate.getTime() - new Date(comparedAt).getTime()) / 60000),
    latestSnapshotAt:    latest,
    previousSnapshotAt:  comparedAt,
    noChanges:           rising.length === 0,
    platform,
  });
}
