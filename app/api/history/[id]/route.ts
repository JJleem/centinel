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
    lang: data.lang,
    createdAt: data.created_at,
  };

  return NextResponse.json({ result });
}
