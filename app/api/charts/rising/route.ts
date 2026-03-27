import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Step 1: get the most recent snapshot time
  const { data: latestRow, error: latestErr } = await supabase
    .from("chart_snapshots")
    .select("fetched_at")
    .eq("collection", "TOP_FREE")
    .eq("category", "GAME")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (latestErr || !latestRow) {
    return NextResponse.json({ error: "no_data" }, { status: 404 });
  }

  const latest = latestRow.fetched_at;
  const latestDate = new Date(latest);

  // Step 2: find the most recent snapshot that's at least 1 hour older than the latest.
  // By querying with .lt() directly we never get truncated by a row limit —
  // any historical snapshot (days/weeks old) will be found.
  const { data: previousRow } = await supabase
    .from("chart_snapshots")
    .select("fetched_at")
    .eq("collection", "TOP_FREE")
    .eq("category", "GAME")
    .lt("fetched_at", new Date(latestDate.getTime() - 60 * 60 * 1000).toISOString())
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
      .eq("collection", "TOP_FREE")
      .eq("category", "GAME")
      .eq("fetched_at", latest),
    supabase
      .from("chart_snapshots")
      .select("app_id, rank")
      .eq("collection", "TOP_FREE")
      .eq("category", "GAME")
      .eq("fetched_at", previous),
  ]);

  if (!newSnap || !oldSnap) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const oldRankMap = new Map(oldSnap.map((g) => [g.app_id, g.rank]));

  const rising = newSnap
    .map((g) => {
      const oldRank = oldRankMap.get(g.app_id);
      const isNewEntry = oldRank == null;
      const rankChange = isNewEntry ? 31 - g.rank : oldRank - g.rank;
      return { ...g, rankChange, isNewEntry };
    })
    .filter((g) => g.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 30)
    .map((g) => ({
      title: g.title,
      appId: g.app_id,
      developer: g.developer,
      score: g.score ?? 0,
      icon: g.icon ?? "",
      genre: g.genre ?? "Game",
      rankChange: g.rankChange,
      isNewEntry: g.isNewEntry,
    }));

  const noChanges = rising.length === 0;

  // 변동 없을 때도 현재 스냅샷 그대로 표시
  const games = noChanges
    ? newSnap
        .sort((a, b) => a.rank - b.rank)
        .map((g) => ({
          title: g.title,
          appId: g.app_id,
          developer: g.developer,
          score: g.score ?? 0,
          icon: g.icon ?? "",
          genre: g.genre ?? "Game",
          rankChange: 0,
          isNewEntry: false,
        }))
    : rising;

  return NextResponse.json({
    games,
    snapshotAge: Math.round((latestDate.getTime() - new Date(previous).getTime()) / 60000),
    latestSnapshotAt: latest,
    previousSnapshotAt: previous,
    noChanges,
  });
}
