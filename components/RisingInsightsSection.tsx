"use client";

import { RisingInsight, GameData } from "@/types";

interface Props {
  insights: RisingInsight[];
  games: GameData[];
  lang?: string;
}

const LABEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "글로벌탑": { bg: "#EBF5FC", color: "#0B7FD4", border: "#C8E4F4" },
  "매출탑":   { bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  "캐주얼탑": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
};

function chartColors(label?: string) {
  return LABEL_COLORS[label ?? "글로벌탑"] ?? LABEL_COLORS["글로벌탑"];
}

export default function RisingInsightsSection({ insights, games, lang }: Props) {
  if (!insights || insights.length === 0) return null;

  const gameMap = new Map(games.map((g) => [g.appId, g]));

  // Sort: chart-ranked games first (by rank asc), then by rankChange desc
  const sorted = [...insights].sort((a, b) => {
    const ga = gameMap.get(a.appId);
    const gb = gameMap.get(b.appId);
    if (ga?.chartRank != null && gb?.chartRank != null) return ga.chartRank - gb.chartRank;
    if (ga?.chartRank != null) return -1;
    if (gb?.chartRank != null) return 1;
    return (b.rankChange ?? 0) - (a.rankChange ?? 0);
  });

  const [hero, ...rest] = sorted;
  const heroGame = gameMap.get(hero.appId);

  const colors = chartColors(heroGame?.chartLabel);

  return (
    <div className="mb-8">
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span
          className="w-[3px] h-5 rounded-full shrink-0"
          style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
        />
        <h2 className="text-lg font-bold text-[#0A1929]">
          {lang === "EN" ? "Why These Games Are Popular" : "이 게임이 왜 인기인가"}
        </h2>
      </div>

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-[18px] border shadow-md mb-3"
        style={{ borderColor: colors.border, background: "#FFFFFF" }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0B7FD4, #6B4EFF)" }} />

        {/* Screenshot blurred background (if available) */}
        {heroGame?.screenshots?.[0] && (
          <div
            className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
            style={{ backgroundImage: `url(${heroGame.screenshots[0]})`, filter: "blur(12px)", transform: "scale(1.1)" }}
          />
        )}

        <div className="relative p-5">
          <div className="flex gap-4">
            {/* Icon */}
            <div className="shrink-0">
              {heroGame?.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroGame.icon}
                  alt={hero.title}
                  className="w-20 h-20 rounded-[18px] object-cover shadow-md"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-[18px] flex items-center justify-center text-3xl shadow-md"
                  style={{ background: colors.bg }}
                >
                  🎮
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {heroGame?.chartRank != null && (
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                  >
                    {heroGame.chartLabel ?? "글로벌탑"} {heroGame.chartRank}위
                  </span>
                )}
                {(hero.rankChange ?? 0) > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ background: "#F0FDF4", color: "#16A34A", borderColor: "#BBF7D0" }}>
                    ▲{hero.rankChange} 급상승
                  </span>
                )}
                {(hero.rankChange ?? 0) < 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ background: "#FFF7F7", color: "#EF4444", borderColor: "#FECACA" }}>
                    ▼{Math.abs(hero.rankChange!)} 하락
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-[#0A1929] leading-tight mb-0.5">{hero.title}</h3>
              <p className="text-xs text-[#4A6080] mb-1">{heroGame?.developer}</p>

              <div className="flex items-center gap-2 text-xs text-[#4A6080]">
                {heroGame?.score != null && heroGame.score > 0 && (
                  <span style={{ color: "#F5A623" }}>⭐ {heroGame.score.toFixed(1)}</span>
                )}
                {heroGame?.genre && <span className="px-1.5 py-0.5 rounded-full" style={{ background: "#F8FBFF", color: "#4A6080" }}>{heroGame.genre}</span>}
              </div>
            </div>

            {/* Screenshot thumbnail */}
            {heroGame?.screenshots?.[0] && (
              <div className="hidden sm:block shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroGame.screenshots[0]}
                  alt="screenshot"
                  className="h-20 w-auto rounded-[10px] object-cover shadow-sm border"
                  style={{ borderColor: "#E8F4FC" }}
                />
              </div>
            )}
          </div>

          {/* Analysis */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F0F7FF" }}>
            <p className="text-sm text-[#1A2E45] leading-relaxed">{hero.reason}</p>
          </div>
        </div>
      </div>

      {/* Rest: 2-col grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rest.map((ins) => {
            const game = gameMap.get(ins.appId);
            const c = chartColors(game?.chartLabel);
            const isRising = ins.rankChange > 0;
            const isFalling = ins.rankChange < 0;

            return (
              <div
                key={ins.appId}
                className="bg-white border rounded-[14px] p-4 shadow-sm hover:shadow-md transition-all"
                style={{ borderColor: "#E8F4FC" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {game?.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.icon} alt={ins.title} className="w-12 h-12 rounded-[12px] shrink-0 object-cover shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-[12px] shrink-0 flex items-center justify-center text-xl" style={{ background: "#EBF5FC" }}>🎮</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-semibold text-[#0A1929]">{ins.title}</span>
                      {game?.chartRank != null && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                          {game.chartLabel ?? "글로벌탑"} {game.chartRank}위
                        </span>
                      )}
                      {isRising && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#F0FDF4", color: "#10B981" }}>
                          ▲{ins.rankChange}
                        </span>
                      )}
                      {isFalling && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#FFF7F7", color: "#EF4444" }}>
                          ▼{Math.abs(ins.rankChange)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#4A6080]">{game?.genre} · {game?.developer}</p>
                  </div>
                </div>
                <p className="text-xs text-[#1A2E45] leading-relaxed">{ins.reason}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
