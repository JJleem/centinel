import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST — save preferred tone
export async function POST(req: NextRequest) {
  const { query, genre, preferredTone, hook } = await req.json();

  if (!query || !genre || !preferredTone) {
    return NextResponse.json({ error: "query, genre, preferredTone required" }, { status: 400 });
  }

  const { error } = await supabase.from("copy_preferences").insert({
    query,
    genre,
    preferred_tone: preferredTone,
    hook: hook ?? null,
    user_id: null, // 로그인 추가 시 채워짐
  });

  if (error) {
    console.error("[feedback] insert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET — aggregate preferences by genre (top 3 tones)
export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre") ?? "";

  if (!genre) {
    return NextResponse.json({ error: "genre required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("copy_preferences")
    .select("preferred_tone")
    .ilike("genre", `%${genre}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count tone frequencies
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.preferred_tone] = (counts[row.preferred_tone] ?? 0) + 1;
  }

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tone, count]) => ({ tone, count }));

  return NextResponse.json({ genre, preferences: ranked, total: data?.length ?? 0 });
}
