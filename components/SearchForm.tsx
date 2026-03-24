"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_CHIPS = [
  "하이퍼캐주얼",
  "하이브리드캐주얼",
  "퍼즐",
  "Voodoo",
  "SayGames",
];

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Stage 1: Scrape
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok) throw new Error(scrapeData.error || "Scrape failed");

      // Stage 2: Analyze
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, games: scrapeData.games }),
      });
      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok)
        throw new Error(analyzeData.error || "Analyze failed");

      // Save to localStorage
      const history = JSON.parse(
        localStorage.getItem("centinel_history") || "[]"
      );
      history.unshift(analyzeData.result);
      localStorage.setItem(
        "centinel_history",
        JSON.stringify(history.slice(0, 10))
      );
      localStorage.setItem(
        "centinel_current",
        JSON.stringify(analyzeData.result)
      );

      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
          placeholder="장르 또는 경쟁사명을 입력하세요 (예: Voodoo, 퍼즐)"
          className="flex-1 bg-[#0A1628] border border-[#1E3A5F] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4DAEDB] transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => handleSubmit(query)}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-[#4DAEDB] hover:bg-[#3A9BC8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? "분석 중..." : "분석 시작"}
        </button>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              handleSubmit(chip);
            }}
            disabled={loading}
            className="px-4 py-1.5 bg-[#0A1628] border border-[#1E3A5F] hover:border-[#4DAEDB] hover:text-[#4DAEDB] text-gray-400 text-sm rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-2 h-2 bg-[#4DAEDB] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-[#8B7FF5] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-[#4DAEDB] rounded-full animate-bounce" />
          </div>
          <p className="text-gray-400 text-sm">
            AI가 트렌드를 분석하고 광고 소재를 생성하고 있습니다...
          </p>
          <div className="flex justify-center gap-6 mt-3 text-xs text-gray-600">
            <span className="text-[#4DAEDB]">① 데이터 수집</span>
            <span className="text-[#8B7FF5]">② 트렌드 분석</span>
            <span className="text-[#4DAEDB]">③ 광고 소재 생성</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
      )}
    </div>
  );
}
