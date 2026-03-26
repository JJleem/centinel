"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}
import Link from "next/link";
import TrendCard from "@/components/TrendCard";
import AdCopyCard from "@/components/AdCopyCard";
import GameCharts from "@/components/GameCharts";
import RisingInsightsSection from "@/components/RisingInsightsSection";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { AnalysisResult } from "@/types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#0A1929] flex items-center gap-3">
      <span
        className="w-[3px] h-5 rounded-full shrink-0"
        style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
      />
      {children}
    </h2>
  );
}

export default function SharedResultPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/history/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.result) setResult(data.result);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [id]);

  return (
    <div className="min-h-screen text-[#0A1929]" style={{ background: "#F8FBFF" }}>
      <nav className="bg-white border-b border-[#E8F4FC] shadow-sm px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-[#0A1929]">Centinel</span>
        </Link>
        <Link
          href="/"
          className="text-sm px-4 py-1.5 text-white rounded-[10px] transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
        >
          새 분석
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#0A1929] font-medium mb-2">분석 결과를 찾을 수 없습니다</p>
            <p className="text-[#4A6080] text-sm mb-6">링크가 만료되었거나 존재하지 않는 결과입니다.</p>
            <Link href="/" className="px-5 py-2 text-white text-sm font-medium rounded-[10px]" style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}>
              새 분석 시작
            </Link>
          </div>
        ) : !result ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-[#0A1929]">분석 결과</h1>
                <span className="px-3 py-1 rounded-full text-sm border" style={{ background: "#EBF5FC", color: "#0B7FD4", borderColor: "#C8E4F4" }}>
                  {result.query}
                </span>
              </div>
              <p className="text-[#4A6080] text-sm">
                {result.games.length}개 게임 분석 · {new Date(result.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>

            {/* Why Popular — above trend insight */}
            {result.risingInsights && result.risingInsights.length > 0 && (
              <RisingInsightsSection insights={result.risingInsights} games={result.games} lang={result.lang} />
            )}

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-[3px] h-5 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }} />
                <h2 className="text-lg font-bold text-[#0A1929]">트렌드 인사이트</h2>
              </div>
              <TrendCard insight={result.insight} query={result.query} usedFallback={result.usedFallback} games={result.games} lang={result.lang} resultId={id} visionResult={result.visionResult} />
            </div>

            <div className="mb-10">
              <div className="mb-4"><SectionTitle>광고 소재 6종</SectionTitle></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.adCopies.map((copy, i) => (
                  <AdCopyCard key={i} adCopy={copy} index={i} />
                ))}
              </div>
            </div>

            <div className="mt-10 mb-8">
              <div className="mb-4"><SectionTitle>수집된 게임 데이터</SectionTitle></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.games.map((game, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-[#E8F4FC] rounded-[14px] p-3 shadow-sm">
                    <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-xl" style={{ background: "#EBF5FC" }}>
                      {game.icon ? <SafeImg src={game.icon} alt={game.title} className="w-full h-full object-cover" /> : "🎮"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0A1929] truncate">{game.title}</p>
                      <p className="text-xs text-[#4A6080] truncate">{game.developer}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: "#F5A623" }}>⭐ {game.score.toFixed(1)}</span>
                        {game.chartRank != null && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full" style={{ background: "#EBF5FC", color: "#0B7FD4" }}>
                            {game.chartLabel ?? "글로벌탑"} {game.chartRank}위
                          </span>
                        )}
                        {(game.rankChange ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full" style={{ background: "#F0FDF4", color: "#10B981" }}>
                            ▲{game.rankChange}
                          </span>
                        )}
                        {(game.rankChange ?? 0) < 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full" style={{ background: "#FFF7F7", color: "#EF4444" }}>
                            ▼{Math.abs(game.rankChange!)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <GameCharts games={result.games} />
          </>
        )}
      </main>
    </div>
  );
}
