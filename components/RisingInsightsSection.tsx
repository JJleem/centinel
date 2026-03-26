"use client";

import { useState } from "react";
import { RisingInsight, GameData } from "@/types";

interface Props {
  insights: RisingInsight[];
  games: GameData[];
  lang?: string;
  createdAt?: string;
}

const LABEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "글로벌탑": { bg: "#EBF5FC", color: "#0B7FD4", border: "#C8E4F4" },
  "매출탑":   { bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  "캐주얼탑": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
};

function chartColors(label?: string) {
  return LABEL_COLORS[label ?? "글로벌탑"] ?? LABEL_COLORS["글로벌탑"];
}

function SafeImg({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} onError={() => setBroken(true)} />;
}

export default function RisingInsightsSection({ insights, games, lang, createdAt }: Props) {
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
      <div className="flex items-start gap-2 mb-4 px-1">
        <span
          className="w-[3px] h-5 rounded-full shrink-0 mt-1"
          style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
        />
        <div>
          <h2 className="text-lg font-bold text-[#0A1929]">
            {lang === "EN" ? "Why These Games Are Popular" : "이 게임이 왜 인기인가"}
          </h2>
          <p className="text-xs text-[#4A6080] mt-0.5">
            {lang === "EN"
              ? "Individual breakdown of top chart games — gameplay hook, retention driver, and why it resonates now"
              : "탑 차트 게임 개별 분석 · 게임플레이 훅, 리텐션 동인, 지금 이 시점에 뜨는 이유를 설명합니다"}
          </p>
          {createdAt && (
            <p className="text-[11px] mt-1" style={{ color: "#C8E4F4" }}>
              {lang === "EN" ? "Chart data as of" : "차트 기준"}{" "}
              {new Date(createdAt).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric", month: "long", day: "numeric",
                hour: "numeric", minute: "2-digit", hour12: true,
              })} KST
            </p>
          )}
        </div>
      </div>

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-[18px] border shadow-md mb-3"
        style={{ borderColor: colors.border, background: "#FFFFFF" }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0B7FD4, #6B4EFF)" }} />

        {/* Screenshot blurred background */}
        {heroGame?.screenshots?.[0] && (
          <SafeImg
            src={heroGame.screenshots[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.06]"
            style={{ filter: "blur(12px)", transform: "scale(1.1)" }}
          />
        )}

        <div className="relative p-5">
          <div className="flex gap-4">
            {/* Icon */}
            <div className="shrink-0">
              {heroGame?.icon ? (
                <div className="w-20 h-20 rounded-[18px] shadow-md overflow-hidden" style={{ background: colors.bg }}>
                  <SafeImg
                    src={heroGame.icon}
                    alt={hero.title}
                    className="w-full h-full object-cover"
                  />
                </div>
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
                {heroGame?.genre && (
                  <span className="px-1.5 py-0.5 rounded-full" style={{ background: "#F8FBFF" }}>{heroGame.genre}</span>
                )}
              </div>
            </div>

            {/* Screenshot thumbnails (up to 3) */}
            {heroGame?.screenshots && heroGame.screenshots.length > 0 && (
              <div className="hidden sm:flex shrink-0 items-start gap-1.5">
                {heroGame.screenshots.slice(0, 3).map((src, i) => (
                  <div key={i} className="h-20 w-auto rounded-[10px] overflow-hidden shadow-sm border" style={{ borderColor: "#E8F4FC" }}>
                    <SafeImg
                      src={src}
                      alt={`screenshot ${i + 1}`}
                      className="h-20 w-auto object-cover"
                    />
                  </div>
                ))}
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
                  <div className="w-12 h-12 rounded-[12px] shrink-0 overflow-hidden shadow-sm" style={{ background: "#EBF5FC" }}>
                    {game?.icon ? (
                      <SafeImg src={game.icon} alt={ins.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
                    )}
                  </div>
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
