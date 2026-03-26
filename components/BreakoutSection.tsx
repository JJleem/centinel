"use client";

import { useState } from "react";
import { BreakoutCandidate } from "@/types";

interface Props {
  candidates: BreakoutCandidate[];
  lang?: string;
}

const LABEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "글로벌탑": { bg: "#EBF5FC", color: "#0B7FD4", border: "#C8E4F4" },
  "매출탑":   { bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  "캐주얼탑": { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
};

function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}

export default function BreakoutSection({ candidates, lang }: Props) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-start gap-2 mb-4 px-1">
        <span
          className="w-[3px] h-5 rounded-full shrink-0 mt-1"
          style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
        />
        <div>
          <h2 className="text-lg font-bold text-[#0A1929]">
            {lang === "EN" ? "Breakout Candidates" : "떡상 가능성 게임"}
          </h2>
          <p className="text-xs text-[#4A6080] mt-0.5">
            {lang === "EN"
              ? "Games rapidly climbing the charts right now — not yet in your analysis"
              : "지금 차트에서 빠르게 순위를 올리고 있는 게임 · 분석에 포함되지 않은 신규 급상승"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {candidates.map((c) => {
          const colors = LABEL_COLORS[c.chartLabel] ?? LABEL_COLORS["글로벌탑"];
          return (
            <div
              key={c.appId}
              className="bg-white border border-[#E8F4FC] rounded-[14px] p-3 shadow-sm hover:shadow-md hover:border-[#C8E4F4] transition-all"
            >
              {/* Icon */}
              <div
                className="w-full aspect-square rounded-[10px] overflow-hidden mb-2.5 flex items-center justify-center text-2xl"
                style={{ background: "#EBF5FC" }}
              >
                {c.icon ? (
                  <SafeImg src={c.icon} alt={c.title} className="w-full h-full object-cover" />
                ) : "🎮"}
              </div>

              {/* Title */}
              <p className="text-xs font-semibold text-[#0A1929] truncate mb-1">{c.title}</p>
              <p className="text-[10px] text-[#4A6080] truncate mb-2">{c.developer}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                  style={{ background: colors.bg, color: colors.color, borderColor: colors.border }}
                >
                  {c.chartLabel} {c.chartRank}위
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#F0FDF4", color: "#16A34A" }}
                >
                  ▲{c.rankChange}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
