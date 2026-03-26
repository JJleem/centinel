"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}
import { useCallback } from "react";
import TrendCard from "@/components/TrendCard";
import RisingInsightsSection from "@/components/RisingInsightsSection";
import AdCopyCard from "@/components/AdCopyCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PdfDownload from "@/components/PdfDownload";
import GameCharts from "@/components/GameCharts";
import ExportButtons from "@/components/ExportButtons";
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

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const current = localStorage.getItem("centinel_current");
    if (current) setResult(JSON.parse(current));
  }, []);

  const copyShareLink = useCallback(() => {
    const id = localStorage.getItem("centinel_current_id");
    if (!id) return;
    navigator.clipboard.writeText(`${window.location.origin}/result/${id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="min-h-screen text-[#0A1929]" style={{ background: "#F8FBFF" }}>
      {/* Nav */}
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
        <div className="flex items-center gap-2 sm:gap-3 no-print">
          <Link
            href="/history"
            className="text-sm text-[#4A6080] hover:text-[#0A1929] transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[10px]"
          >
            히스토리
          </Link>
          <div className="hidden sm:contents">
            {result && <ExportButtons result={result} />}
            <PdfDownload />
            <button
              onClick={copyShareLink}
              className="text-sm px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] text-[#4A6080] hover:text-[#0B7FD4] rounded-[10px] transition-colors whitespace-nowrap"
            >
              {copied ? "✓ 복사됨" : "🔗 공유 링크"}
            </button>
          </div>
          <Link
            href="/"
            className="text-sm px-4 py-1.5 text-white rounded-[10px] transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            새 분석
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main id="pdf-content" className="max-w-6xl mx-auto px-6 py-8">
        {!result ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-[#0A1929]">분석 결과</h1>
                <span
                  className="px-3 py-1 rounded-full text-sm border"
                  style={{ background: "#EBF5FC", color: "#0B7FD4", borderColor: "#C8E4F4" }}
                >
                  {result.query}
                </span>
              </div>
              <p className="text-[#4A6080] text-sm">
                {result.games.length}개 게임 분석 ·{" "}
                {new Date(result.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>

            {/* Pipeline stages */}
            <div className="flex items-center gap-2 mb-6 text-xs overflow-x-auto pb-1">
              {[
                "① 트렌드 분석 (Sonnet)",
                "② 인사이트 앙상블 (Haiku ×2)",
                "③ 광고 소재 앙상블 (Haiku ×2)",
                "④ 오케스트레이터 선별 (Sonnet)",
              ].map((label, i, arr) => (
                <span key={i} className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 bg-white border border-[#E8F4FC] rounded-[10px] px-3 py-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
                    />
                    <span className="text-[#0B7FD4]">{label}</span>
                  </span>
                  {i < arr.length - 1 && <span className="text-[#C8E4F4]">→</span>}
                </span>
              ))}
            </div>

            {/* Why Popular — above trend insight */}
            {result.risingInsights && result.risingInsights.length > 0 && (
              <RisingInsightsSection insights={result.risingInsights} games={result.games} lang={result.lang} />
            )}

            {/* Trend insight */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-[3px] h-5 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }} />
                <h2 className="text-lg font-bold text-[#0A1929]">트렌드 인사이트</h2>
              </div>
              <TrendCard insight={result.insight} query={result.query} usedFallback={result.usedFallback} games={result.games} lang={result.lang} resultId={typeof window !== "undefined" ? localStorage.getItem("centinel_current_id") : null} />
            </div>

            {/* Ad copies */}
            <div className="pdf-section mb-10">
              <div className="flex items-start justify-between mb-2">
                <SectionTitle>광고 소재 6종</SectionTitle>
              </div>
              <p className="text-xs text-[#4A6080] leading-relaxed mb-4 px-1">
                이 광고 소재는 경쟁사/장르 트렌드를 분석하여 AI가 생성한 참고용 초안입니다. 실제 시장에서 반응하는 패턴을 기반으로 마케터가 소재 기획 시 레퍼런스로 활용할 수 있습니다.
              </p>
              <div className="pdf-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.adCopies.map((copy, i) => (
                  <AdCopyCard key={i} adCopy={copy} index={i} />
                ))}
              </div>
            </div>

            {/* Game data cards */}
            <div className="pdf-section mt-10">
              <div className="mb-4">
                <SectionTitle>수집된 게임 데이터</SectionTitle>
              </div>
              <div className="pdf-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.games.map((game, i) => (
                  <div
                    key={i}
                    className="pdf-card flex items-center gap-3 bg-white border border-[#E8F4FC] rounded-[14px] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-100/50 hover:border-[#C8E4F4] shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-[#0B7FD4] font-bold text-lg" style={{ background: "#EBF5FC" }}>
                      {game.icon
                        ? <SafeImg src={game.icon} alt={game.title} className="w-full h-full object-cover" />
                        : game.title.charAt(0)
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#0A1929] font-semibold text-sm truncate">{game.title}</p>
                      <p className="text-[#4A6080] text-xs truncate">{game.developer}</p>
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

            {/* Charts */}
            <GameCharts games={result.games} />
          </>
        )}
      </main>
    </div>
  );
}
