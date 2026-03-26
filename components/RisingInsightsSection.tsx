"use client";

import { RisingInsight, GameData } from "@/types";

interface Props {
  insights: RisingInsight[];
  games: GameData[];
  lang?: string;
}

export default function RisingInsightsSection({ insights, games, lang }: Props) {
  if (!insights || insights.length === 0) return null;

  const gameMap = new Map(games.map((g) => [g.appId, g]));

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <span
          className="w-[3px] h-5 rounded-full shrink-0"
          style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
        />
        <h2 className="text-lg font-bold text-[#0A1929]">
          {lang === "EN" ? "Why These Games Are Popular" : "이 게임이 왜 인기인가"}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((ins) => {
          const game = gameMap.get(ins.appId);
          const isRising = ins.rankChange > 0;
          const isFalling = ins.rankChange < 0;

          return (
            <div
              key={ins.appId}
              className="bg-white border border-[#E8F4FC] rounded-[14px] p-4 shadow-sm hover:shadow-md hover:border-[#C8E4F4] transition-all"
            >
              <div className="flex items-center gap-3 mb-2.5">
                {game?.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.icon} alt={ins.title} className="w-10 h-10 rounded-[10px] shrink-0 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-[10px] shrink-0 flex items-center justify-center text-lg" style={{ background: "#EBF5FC" }}>🎮</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-[#0A1929] truncate">{ins.title}</span>
                    {game?.chartRank != null && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "#EBF5FC", color: "#0B7FD4" }}
                      >
                        {game.chartLabel ?? "글로벌탑"} {game.chartRank}위
                      </span>
                    )}
                    {isRising && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "#F0FDF4", color: "#10B981" }}
                      >
                        ▲{ins.rankChange}
                      </span>
                    )}
                    {isFalling && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "#FFF7F7", color: "#EF4444" }}
                      >
                        ▼{Math.abs(ins.rankChange)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#4A6080]">{game?.genre}</span>
                </div>
              </div>
              <p className="text-xs text-[#0A1929] leading-relaxed">{ins.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
