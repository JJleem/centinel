import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [todayRes, weekRes, monthRes, recentRes] = await Promise.all([
    supabase.from("token_logs").select("sonnet_input,sonnet_output,haiku_input,haiku_output,estimated_cost_usd").gte("created_at", todayStart),
    supabase.from("token_logs").select("sonnet_input,sonnet_output,haiku_input,haiku_output,estimated_cost_usd").gte("created_at", weekStart),
    supabase.from("token_logs").select("sonnet_input,sonnet_output,haiku_input,haiku_output,estimated_cost_usd").gte("created_at", monthStart),
    supabase.from("token_logs").select("query,sonnet_input,sonnet_output,haiku_input,haiku_output,estimated_cost_usd,created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  function sum(rows: { sonnet_input: number; sonnet_output: number; haiku_input: number; haiku_output: number; estimated_cost_usd: number }[]) {
    return rows.reduce(
      (acc, r) => ({
        sonnetInput:  acc.sonnetInput  + (r.sonnet_input  ?? 0),
        sonnetOutput: acc.sonnetOutput + (r.sonnet_output ?? 0),
        haikuInput:   acc.haikuInput   + (r.haiku_input   ?? 0),
        haikuOutput:  acc.haikuOutput  + (r.haiku_output  ?? 0),
        cost:         acc.cost         + (r.estimated_cost_usd ?? 0),
        count:        acc.count + 1,
      }),
      { sonnetInput: 0, sonnetOutput: 0, haikuInput: 0, haikuOutput: 0, cost: 0, count: 0 }
    );
  }

  return NextResponse.json({
    today:  sum(todayRes.data  ?? []),
    week:   sum(weekRes.data   ?? []),
    month:  sum(monthRes.data  ?? []),
    recent: recentRes.data ?? [],
  });
}
