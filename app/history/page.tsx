"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnalysisResult } from "@/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("centinel_history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const loadResult = (item: AnalysisResult) => {
    localStorage.setItem("centinel_current", JSON.stringify(item));
    router.push("/result");
  };

  const clearHistory = () => {
    localStorage.removeItem("centinel_history");
    localStorage.removeItem("centinel_current");
    setHistory([]);
  };

  return (
    <div className="min-h-screen text-[#0A1929]" style={{ background: "#F8FBFF" }}>
      {/* Nav */}
      <nav className="bg-white border-b border-[#E8F4FC] shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-[#0A1929]">Centinel</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm px-4 py-1.5 text-white rounded-[10px] transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            새 분석
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1929]">분석 히스토리</h1>
            <p className="text-[#4A6080] text-sm mt-1">
              최근 분석 결과를 다시 확인할 수 있습니다.
            </p>
          </div>
          {mounted && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-[#4A6080] hover:text-red-500 transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-red-200 rounded-[10px] bg-white"
            >
              전체 삭제
            </button>
          )}
        </div>

        {/* Prototype notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-[12px] border mb-6" style={{ background: "#F5F0FF", borderColor: "#D4C9FF" }}>
          <span className="text-base shrink-0 mt-0.5">🔧</span>
          <p className="text-xs text-[#6B4EFF] leading-relaxed">
            <strong>프로토타입 안내</strong> — 현재 히스토리는 브라우저 localStorage에 최근 10개까지 저장됩니다.
            프로덕션 전환 시 서버 DB 연동 및 사용자 인증(Google OAuth 등)을 도입하여 기기 간 동기화와
            API 호출 보호를 구현할 예정입니다.
          </p>
        </div>

        {/* Empty state */}
        {mounted && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8F4FC] flex items-center justify-center mb-4 shadow-sm">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-[#0A1929] font-medium mb-1">분석 히스토리가 없습니다</p>
            <p className="text-[#4A6080] text-sm mb-6">
              검색을 시작하면 최근 10개의 분석이 자동 저장됩니다.
            </p>
            <Link
              href="/"
              className="px-5 py-2 text-white text-sm font-medium rounded-[10px] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
            >
              첫 분석 시작하기
            </Link>
          </div>
        )}

        {/* Loading placeholder */}
        {!mounted && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white border border-[#E8F4FC] rounded-[14px] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* History cards */}
        {mounted && history.length > 0 && (
          <div className="space-y-3">
            {history.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[14px] p-5 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/50 hover:-translate-y-[2px] shadow-sm group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ background: "#EBF5FC", color: "#4A6080", borderColor: "#C8E4F4" }}
                      >
                        #{history.length - i}
                      </span>
                      <h2 className="text-base font-semibold text-[#0A1929] truncate">
                        {item.query}
                      </h2>
                    </div>
                    <p className="text-[#4A6080] text-xs mb-3">
                      {new Date(item.createdAt).toLocaleString("ko-KR")} ·{" "}
                      {item.games.length}개 게임 분석
                      {item.usedFallback && (
                        <span className="ml-2 text-yellow-600">· 폴백 데이터</span>
                      )}
                    </p>
                    {item.insight?.topKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.insight.topKeywords.slice(0, 3).map((kw, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 text-[11px] rounded-full border"
                            style={{ background: "#EBF5FC", color: "#0B7FD4", borderColor: "#C8E4F4" }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => loadResult(item)}
                    className="shrink-0 text-sm px-4 py-2 border border-[#E8F4FC] group-hover:border-[#C8E4F4] text-[#4A6080] group-hover:text-[#0B7FD4] rounded-[10px] transition-colors whitespace-nowrap bg-white"
                  >
                    결과 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
