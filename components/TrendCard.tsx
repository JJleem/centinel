"use client";

import { useState } from "react";
import { InsightSummary, GameData } from "@/types";
import VisionAnalysis from "@/components/VisionAnalysis";

interface Props {
  insight: InsightSummary;
  query: string;
  usedFallback?: boolean;
  games?: GameData[];
  lang?: string;
  resultId?: string | null;
  visionResult?: import("@/types").VisionResult | null;
}

function GameIconStrip({ games }: { games: GameData[] }) {
  return (
    <div className="flex items-center mb-5">
      <div className="flex items-center">
        {games.map((game, i) => (
          <GameIcon key={i} game={game} index={i} />
        ))}
      </div>
      <span className="ml-3 text-xs text-[#4A6080] shrink-0">
        +{games.length}개 게임 분석
      </span>
    </div>
  );
}

function GameIcon({ game, index }: { game: GameData; index: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="relative group"
      style={{ marginLeft: index === 0 ? 0 : -6, zIndex: index }}
    >
      {game.icon && !failed ? (
        <img
          src={game.icon}
          alt={game.title}
          width={36}
          height={36}
          onError={() => setFailed(true)}
          className="w-9 h-9 rounded-[8px] object-cover"
          style={{ border: "1.5px solid #E8F4FC" }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#0B7FD4] font-bold text-sm"
          style={{ border: "1.5px solid #E8F4FC", background: "#EBF5FC" }}
        >
          {game.title.charAt(0)}
        </div>
      )}
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#0A1929] text-white text-[10px] rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {game.title}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#0A1929]" />
      </div>
    </div>
  );
}

export default function TrendCard({ insight, query, usedFallback, games, lang, resultId, visionResult }: Props) {
  return (
    <div className="pdf-card bg-white border border-[#E8F4FC] rounded-[14px] p-6 shadow-sm overflow-hidden relative">
      {/* Left gradient accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[14px]"
        style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
      />

      {usedFallback && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-[10px] bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs">
          ⚠️ 검색 결과가 부족하여 유사 장르 데이터로 분석했습니다
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span className="ml-auto text-xs text-[#4A6080] bg-[#EBF5FC] px-2 py-1 rounded-full border border-[#C8E4F4]">
          {query}
        </span>
      </div>

      {/* Game icons */}
      {games && games.length > 0 && <GameIconStrip games={games} />}

      {/* Top keywords */}
      <div className="flex flex-wrap gap-2 mb-5">
        {insight.topKeywords.map((kw) => (
          <span
            key={kw}
            className="px-3 py-1 rounded-full text-sm font-medium border"
            style={{ background: "#EBF5FC", color: "#0B7FD4", borderColor: "#C8E4F4" }}
          >
            # {kw}
          </span>
        ))}
      </div>

      <hr style={{ borderColor: "#EEF6FB", borderTopWidth: 1 }} className="mb-5" />

      {/* 5-line summary */}
      <ul className="space-y-3 mb-5">
        {insight.summary.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
            >
              {i + 1}
            </span>
            <p className="text-[#0A1929] text-sm leading-relaxed">{line}</p>
          </li>
        ))}
      </ul>

      {/* Extended sections */}
      <hr style={{ borderColor: "#EEF6FB", borderTopWidth: 1 }} className="mb-5" />

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1.6fr)" }}
      >
        {insight.notableMechanics && insight.notableMechanics.length > 0 && (
          <div className="border-r border-[#EEF6FB] pr-4">
            <p className="text-xs font-semibold text-[#4A6080] mb-2">🎮 주목할 메카닉</p>
            <ul className="space-y-1.5">
              {insight.notableMechanics.map((m, i) => (
                <li key={i} className="text-xs text-[#0A1929] flex gap-1.5 items-start">
                  <span className="text-[#0B7FD4] shrink-0 mt-0.5">·</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insight.revenueModelTrends && insight.revenueModelTrends.length > 0 && (
          <div className="border-r border-[#EEF6FB] pr-4">
            <p className="text-xs font-semibold text-[#4A6080] mb-2">💰 수익 모델 트렌드</p>
            <ul className="space-y-1.5">
              {insight.revenueModelTrends.map((r, i) => (
                <li key={i} className="text-xs text-[#0A1929] flex gap-1.5 items-start">
                  <span className="text-[#0B7FD4] shrink-0 mt-0.5">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insight.marketOpportunity && (
          <div>
            <p className="text-xs font-semibold text-[#4A6080] mb-2">🎯 시장 기회</p>
            <p className="text-xs text-[#0A1929] leading-relaxed">{insight.marketOpportunity}</p>
          </div>
        )}
      </div>

      {/* Vision Analysis */}
      {games && games.length > 0 && <VisionAnalysis games={games} lang={lang ?? "KO"} resultId={resultId} initialVisionResult={visionResult} />}
    </div>
  );
}
