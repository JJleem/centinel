import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { AnalysisResult } from "@/types";

export async function GET() {
  const { data, error } = await supabase
    .from("analysis_history")
    .select("id, query, insight, trend_analysis, created_at, lang")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data });
}

export async function POST(req: NextRequest) {
  const result: AnalysisResult = await req.json();

  const { data, error } = await supabase
    .from("analysis_history")
    .insert({
      query: result.query,
      games: result.games,
      trend_analysis: result.trendAnalysis,
      insight: result.insight,
      ad_copies: result.adCopies,
      rising_insights: result.risingInsights ?? null,
      vision_result: result.visionResult ?? null,
      lang: result.lang ?? "EN",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
