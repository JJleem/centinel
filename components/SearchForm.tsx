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
  "트렌드 분석 에이전트 (Sonnet)",
  "인사이트 앙상블 (Haiku ×2 병렬)",
  "광고 소재 앙상블 (Haiku ×2 병렬)",
  "오케스트레이터 최종 선별 (Sonnet)",
];

const INITIAL_STATUSES: StepStatus[] = ["waiting", "waiting", "waiting", "waiting", "waiting"];

function StepIndicator({ status, label }: { status: StepStatus; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
        {status === "done" ? (
          <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center">
            <span className="text-emerald-500 text-[10px] font-bold">✓</span>
          </div>
        ) : status === "active" ? (
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#0B7FD4", borderTopColor: "transparent" }}
          />
        ) : status === "error" ? (
          <div className="w-5 h-5 rounded-full bg-red-50 border border-red-300 flex items-center justify-center">
            <span className="text-red-500 text-[10px] font-bold">✕</span>
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border border-[#C8E4F4]" />
        )}
      </div>
      <span className={`text-sm transition-colors ${
        status === "done"    ? "text-emerald-600" :
        status === "active"  ? "text-[#0A1929] font-medium" :
        status === "error"   ? "text-red-500" :
                               "text-[#4A6080]"
      }`}>
        {label}
        {status === "active" && <span className="text-[#4A6080] ml-1">...</span>}
      </span>
    </div>
  );
}

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<Lang>("KO");
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
    setStepStatuses(["active", "waiting", "waiting", "waiting", "waiting"]);

    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || "Scrape failed");
      setStep(0, "done");
      setStep(1, "active");

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
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          if (data.error) throw new Error(String(data.error));
          if (data.event === "analysis_done") { setStep(1, "done"); setStep(2, "active"); }
          else if (data.event === "insights_ensemble_done") { setStep(2, "done"); setStep(3, "active"); }
          else if (data.event === "copies_ensemble_done") { setStep(3, "done"); setStep(4, "active"); }
          else if (data.event === "final_selection_done") { setStep(4, "done"); finalResult = data.result; }
        }
      }

      if (!finalResult) throw new Error("분석 결과를 받지 못했습니다");

      const history = JSON.parse(localStorage.getItem("centinel_history") || "[]");
      const resultWithFallback = { ...finalResult, usedFallback: scrapeData.usedFallback ?? false, lang };
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
    <div className="w-full">
      {/* Lang toggle row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[#4A6080] text-xs">장르 · 경쟁사 · 게임명 검색</span>
        <div className="flex items-center gap-2.5">
          {/* Hint bubble */}
          {mounted && !loading && query.trim().length === 0 && (
            <div className="relative flex items-center">
              <div className="bg-[#EBF5FC] border border-[#C8E4F4] text-[#1A7AAF] text-[11px] leading-tight px-2.5 py-1.5 rounded-[10px] whitespace-nowrap">
                결과 언어를 선택해주세요
              </div>
              <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[6px] border-t-transparent border-b-transparent border-l-[#C8E4F4]" />
            </div>
          )}

          {/* Lang toggle */}
          <div className="flex items-center gap-1 bg-[#F8FBFF] border border-[#E8F4FC] rounded-[10px] p-0.5">
            {(["EN", "KO"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                disabled={loading}
                className={`px-3 py-1 text-xs font-semibold rounded-[8px] transition-all duration-200 disabled:cursor-not-allowed ${
                  lang === l
                    ? "text-white shadow-sm"
                    : "text-[#4A6080] hover:text-[#0A1929]"
                }`}
                style={lang === l ? { background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" } : {}}
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
          className="flex-1 rounded-[10px] px-5 py-4 text-[#0A1929] placeholder-[#4A6080] text-base focus:outline-none focus:ring-2 transition-all border"
          style={{ background: "#F8FBFF", borderColor: "#C8E4F4" }}
          disabled={loading}
        />
        <button
          onClick={() => handleSubmit(query)}
          disabled={loading || query.trim().length < 2}
          className="px-6 py-4 text-white font-bold text-sm rounded-[10px] shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
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
              onClick={() => setQuery(chip)}
              disabled={loading}
              className="px-4 py-2 text-[#1A7AAF] text-sm rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0B7FD4] hover:text-[#0B7FD4]"
              style={{ background: "#EBF5FC", borderColor: "#C8E4F4" }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Step-based loading UI */}
      {loading && (
        <div className="bg-white border border-[#E8F4FC] rounded-[14px] p-5 space-y-3.5 shadow-sm">
          {STEP_LABELS.map((label, i) => (
            <StepIndicator key={i} status={stepStatuses[i]} label={label} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm text-center mt-3 bg-red-50 border border-red-200 rounded-[10px] py-2">{error}</p>
      )}
    </div>
  );
}
