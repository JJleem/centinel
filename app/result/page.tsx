"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TrendCard from "@/components/TrendCard";
import AdCopyCard from "@/components/AdCopyCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PdfDownload from "@/components/PdfDownload";
import { AnalysisResult } from "@/types";

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const current = localStorage.getItem("centinel_current");
    const hist = localStorage.getItem("centinel_history");
    if (current) setResult(JSON.parse(current));
    if (hist) setHistory(JSON.parse(hist));
  }, []);

  const loadFromHistory = (item: AnalysisResult) => {
    setResult(item);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      {/* Nav */}
      <nav className="border-b border-[#1E3A5F] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4DAEDB] to-[#8B7FF5] flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-white">Centinel</span>
        </Link>
        <div className="flex items-center gap-3 no-print">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 border border-[#1E3A5F] rounded-lg"
            >
              히스토리 ({history.length})
            </button>
          )}
          <PdfDownload />
          <Link
            href="/"
            className="text-sm px-4 py-1.5 bg-[#4DAEDB] hover:bg-[#3A9BC8] text-white rounded-lg transition-colors"
          >
            새 분석
          </Link>
        </div>
      </nav>

      {/* History panel */}
      {showHistory && (
        <div className="no-print border-b border-[#1E3A5F] bg-[#0A1628] px-6 py-4">
          <p className="text-xs text-gray-500 mb-3">최근 분석 히스토리</p>
          <div className="flex flex-wrap gap-2">
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => loadFromHistory(item)}
                className="px-3 py-1.5 bg-[#020810] border border-[#1E3A5F] hover:border-[#4DAEDB] text-gray-400 hover:text-[#4DAEDB] text-xs rounded-lg transition-colors"
              >
                {item.query} · {new Date(item.createdAt).toLocaleDateString("ko-KR")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main id="pdf-content" className="max-w-6xl mx-auto px-6 py-8">
        {!result ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">분석 결과</h1>
                <span className="px-3 py-1 bg-[#4DAEDB]/10 text-[#4DAEDB] border border-[#4DAEDB]/20 rounded-full text-sm">
                  {result.query}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                {result.games.length}개 게임 분석 ·{" "}
                {new Date(result.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>

            {/* Claude pipeline stages */}
            <div className="flex items-center gap-2 mb-6 text-xs overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 bg-[#0A1628] border border-[#4DAEDB]/20 rounded-lg px-3 py-2 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4DAEDB]" />
                <span className="text-[#4DAEDB]">① 트렌드 분석 완료</span>
              </div>
              <span className="text-gray-700 shrink-0">→</span>
              <div className="flex items-center gap-1.5 bg-[#0A1628] border border-[#8B7FF5]/20 rounded-lg px-3 py-2 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8B7FF5]" />
                <span className="text-[#8B7FF5]">② 인사이트 요약 완료</span>
              </div>
              <span className="text-gray-700 shrink-0">→</span>
              <div className="flex items-center gap-1.5 bg-[#0A1628] border border-[#4DAEDB]/20 rounded-lg px-3 py-2 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4DAEDB]" />
                <span className="text-[#4DAEDB]">③ 광고 소재 5종 생성 완료</span>
              </div>
            </div>

            {/* Trend insight */}
            <div className="mb-8">
              <TrendCard insight={result.insight} query={result.query} usedFallback={result.usedFallback} />
            </div>

            {/* Ad copies */}
            <div className="pdf-section">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8B7FF5]" />
                광고 소재 5종
              </h2>
              {/* Disclaimer */}
              <p className="text-xs text-gray-400 leading-relaxed mb-4 px-1">
                💡 이 광고 소재는 경쟁사/장르 트렌드를 분석하여 AI가 생성한 참고용 초안입니다. 실제 시장에서 반응하는 패턴을 기반으로 마케터가 소재 기획 시 레퍼런스로 활용할 수 있습니다.
              </p>
              <div className="pdf-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.adCopies.map((copy, i) => (
                  <AdCopyCard key={i} adCopy={copy} index={i} />
                ))}
              </div>
            </div>

            {/* Game data cards */}
            <div className="pdf-section mt-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                수집된 게임 데이터
              </h2>
              <div className="pdf-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.games.map((game, i) => (
                  <div
                    key={i}
                    className="pdf-card flex items-center gap-3 bg-[#0A1628] border border-[rgba(77,174,219,0.2)] hover:border-[rgba(77,174,219,0.5)] rounded-[10px] p-3 transition-colors"
                  >
                    {/* Icon */}
                    {game.icon ? (
                      <img
                        src={game.icon}
                        alt={game.title}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg shrink-0 bg-[#1E3A5F] flex items-center justify-center text-[#4DAEDB] font-bold text-base">
                        {game.title.charAt(0)}
                      </div>
                    )}
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm truncate">{game.title}</p>
                      <p className="text-gray-500 text-xs truncate">{game.developer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-400 text-xs">⭐ {game.score.toFixed(1)}</span>
                        <span className="px-1.5 py-0.5 bg-[#020810] border border-[#1E3A5F] text-gray-500 text-[10px] rounded-full truncate">
                          {game.genre}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
