import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = {
    query: data.query,
    games: data.games,
    trendAnalysis: data.trend_analysis,
    insight: data.insight,
    adCopies: data.ad_copies,
    risingInsights: data.rising_insights ?? null,
    similarGames: data.similar_games ?? null,
    breakoutCandidates: data.breakout_candidates ?? null,
    visionResult: data.vision_result ?? null,
    lang: data.lang,
    createdAt: data.created_at,
  };

  return NextResponse.json({ result });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { visionResult } = await req.json();

  const { error } = await supabase
    .from("analysis_history")
    .update({ vision_result: visionResult })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
