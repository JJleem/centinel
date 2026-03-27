"use client";

import { useState } from "react";
import { SimilarGame } from "@/types";

interface Props {
  games: SimilarGame[];
  sourceTitle: string; // name of the chart game that was analyzed
  lang?: string;
}

function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}

export default function SimilarGamesSection({ games, sourceTitle, lang }: Props) {
  if (!games || games.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-start gap-2 mb-4 px-1">
        <span
          className="w-[3px] h-5 rounded-full shrink-0 mt-1"
          style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
        />
        <div>
          <h2 className="text-lg font-bold text-[#0A1929]">
            {lang === "EN" ? "Breakout Candidates" : "떡상 가능성"}
          </h2>
          <p className="text-xs text-[#4A6080] mt-0.5">
            {lang === "EN"
              ? `Games similar to ${sourceTitle} — potential next breakout titles`
              : `${sourceTitle}와 비슷한 장르·스타일의 게임 — 다음 트렌드 후보`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {games.map((game) => (
          <div
            key={game.appId}
            className="bg-white border border-[#E8F4FC] rounded-[14px] p-2.5 shadow-sm hover:shadow-md hover:border-[#C8E4F4] transition-all flex flex-col items-center text-center"
          >
            <div
              className="w-full aspect-square rounded-[10px] overflow-hidden mb-2 flex items-center justify-center text-2xl"
              style={{ background: "#EBF5FC" }}
            >
              {game.icon
                ? <SafeImg src={game.icon} alt={game.title} className="w-full h-full object-cover" />
                : "🎮"
              }
            </div>
            <p className="text-[11px] font-semibold text-[#0A1929] line-clamp-2 leading-tight mb-0.5 w-full">{game.title}</p>
            <p className="text-[9px] text-[#4A6080] truncate w-full">{game.developer}</p>
            {game.score > 0 && (
              <p className="text-[9px] mt-1" style={{ color: "#F5A623" }}>⭐ {game.score.toFixed(1)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
