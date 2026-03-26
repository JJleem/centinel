import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Get the two most recent distinct snapshot times for TOP_FREE/GAME
  const { data: times, error: timesErr } = await supabase
    .from("chart_snapshots")
    .select("fetched_at")
    .eq("collection", "TOP_FREE")
    .eq("category", "GAME")
    .order("fetched_at", { ascending: false })
    .limit(200);

  if (timesErr || !times || times.length === 0) {
    return NextResponse.json({ error: "no_data" }, { status: 404 });
  }

  // Find two distinct snapshot buckets (at least 1 hour apart)
  const latest = times[0].fetched_at;
  const latestDate = new Date(latest);
  const previous = times.find(
    (t) => new Date(t.fetched_at).getTime() < latestDate.getTime() - 60 * 60 * 1000
  );

  if (!previous) {
    return NextResponse.json({ error: "insufficient_snapshots", latestSnapshotAt: latest }, { status: 202 });
  }

  // Fetch both snapshots
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
      .eq("fetched_at", previous.fetched_at),
  ]);

  if (!newSnap || !oldSnap) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const oldRankMap = new Map(oldSnap.map((g) => [g.app_id, g.rank]));

  const rising = newSnap
    .map((g) => {
      const oldRank = oldRankMap.get(g.app_id);
      const rankChange = oldRank != null ? oldRank - g.rank : 30; // new entry = big jump
      return { ...g, rankChange };
    })
    .filter((g) => g.rankChange > 0) // only actually rising
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
    }));

  return NextResponse.json({
    games: rising,
    snapshotAge: Math.round((latestDate.getTime() - new Date(previous.fetched_at).getTime()) / 60000),
    latestSnapshotAt: latest,
    previousSnapshotAt: previous.fetched_at,
    noChanges: rising.length === 0,
  });
}
