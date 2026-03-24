"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_CHIPS = [
  "hyper casual",
  "hybrid casual",
  "Voodoo",
  "SayGames",
  "Azur Games",
];

type Lang = "EN" | "KO";
type StepStatus = "waiting" | "active" | "done" | "error";

const STEP_LABELS = [
  "Google Play 데이터 수집",
  "Claude AI 트렌드 분석",
  "광고 소재 생성",
];

const INITIAL_STATUSES: StepStatus[] = ["waiting", "waiting", "waiting"];

function StepIndicator({ status, label }: { status: StepStatus; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
        {status === "done" ? (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <span className="text-emerald-400 text-[10px] font-bold">✓</span>
          </div>
        ) : status === "active" ? (
          <div className="w-4 h-4 rounded-full border-2 border-[#4DAEDB] border-t-transparent animate-spin" />
        ) : status === "error" ? (
          <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-red-400 text-[10px] font-bold">✕</span>
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border border-gray-700" />
        )}
      </div>
      <span className={`text-sm transition-colors ${
        status === "done"    ? "text-emerald-400" :
        status === "active"  ? "text-white" :
        status === "error"   ? "text-red-400" :
                               "text-gray-600"
      }`}>
        {label}
        {status === "active" && <span className="text-gray-500"> ...</span>}
      </span>
    </div>
  );
}

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<Lang>("EN");
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(INITIAL_STATUSES);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const setStep = (index: number, status: StepStatus) => {
    setStepStatuses(prev => prev.map((s, i) => i === index ? status : s));
  };

  const handleSubmit = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setStepStatuses(["active", "waiting", "waiting"]);

    try {
      // Step 1: Scrape
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || "Scrape failed");
      setStep(0, "done");
      setStep(1, "active");

      // Step 2+3: Analyze via SSE stream
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, games: scrapeData.games, lang }),
      });
      if (!analyzeRes.ok) throw new Error("Analyze request failed");
      if (!analyzeRes.body) throw new Error("No response body");

      const reader = analyzeRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue; // skip malformed line
          }

          if (data.error) throw new Error(String(data.error));

          if (data.step === 1) {
            // trendAnalysis done — insight still running, keep step 2 active
          } else if (data.step === 2) {
            // insight done — move to ad copy generation
            setStep(1, "done");
            setStep(2, "active");
          } else if (data.step === 3) {
            setStep(2, "done");
            finalResult = data.result;
          }
        }
      }

      if (!finalResult) throw new Error("분석 결과를 받지 못했습니다");

      // Save to localStorage
      const history = JSON.parse(localStorage.getItem("centinel_history") || "[]");
      const resultWithFallback = { ...finalResult, usedFallback: scrapeData.usedFallback ?? false };
      history.unshift(resultWithFallback);
      localStorage.setItem("centinel_history", JSON.stringify(history.slice(0, 10)));
      localStorage.setItem("centinel_current", JSON.stringify(resultWithFallback));

      router.push("/result");
    } catch (err) {
      setStepStatuses(prev => prev.map(s => s === "active" ? "error" : s));
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Label row + lang toggle */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-gray-600">장르 / 경쟁사 검색</span>
        <div className="flex items-center gap-2.5">
          {/* Speech bubble hint — visible before user types */}
          {mounted && !loading && query.trim().length === 0 && (
            <div className="relative flex items-center">
              <div className="bg-[#0D1F3C] border border-[#4DAEDB]/25 text-[#4DAEDB]/80 text-[11px] leading-tight px-2.5 py-1.5 rounded-lg whitespace-nowrap animate-pulse">
                결과 언어를 선택해주세요
              </div>
              {/* Arrow pointing right toward toggle */}
              <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[6px] border-t-transparent border-b-transparent border-l-[#4DAEDB]/25" />
            </div>
          )}

          {/* Lang toggle — two distinct pill buttons */}
          <div className="flex items-center gap-1">
            {(["EN", "KO"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                disabled={loading}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 disabled:cursor-not-allowed ${
                  lang === l
                    ? "bg-gradient-to-r from-[#4DAEDB] to-[#3A9BC8] text-white shadow-[0_0_10px_rgba(77,174,219,0.25)]"
                    : "bg-[#0A1628] border border-[#1E3A5F] text-gray-500 hover:text-gray-300 hover:border-[#4DAEDB]/40"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
          placeholder="게임명, 장르, 경쟁사를 입력하세요 (예: hyper casual, Voodoo)"
          className="flex-1 bg-[#0A1628] border border-[#1E3A5F] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#4DAEDB] transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => handleSubmit(query)}
          disabled={loading || query.trim().length < 2}
          className="px-6 py-3 bg-[#4DAEDB] hover:bg-[#3A9BC8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {loading ? "분석 중..." : "분석 시작"}
        </button>
      </div>

      {/* Quick chips */}
      {mounted && (
        <div className="flex flex-wrap gap-2 mb-6">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => { setQuery(chip); handleSubmit(chip); }}
              disabled={loading}
              className="px-4 py-1.5 bg-[#0A1628] border border-[#1E3A5F] hover:border-[#4DAEDB] hover:text-[#4DAEDB] text-gray-400 text-sm rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Step-based loading UI */}
      {loading && (
        <div className="bg-[#0A1628] border border-[#1E3A5F] rounded-2xl p-5 space-y-4">
          {STEP_LABELS.map((label, i) => (
            <StepIndicator key={i} status={stepStatuses[i]} label={label} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center mt-3">{error}</p>
      )}
    </div>
  );
}
