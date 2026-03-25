"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/types";

export default function HistorySection() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("centinel_history");
    if (raw) setHistory(JSON.parse(raw).slice(0, 3));
  }, []);

  if (history.length === 0) return null;

  const handleClick = (item: AnalysisResult) => {
    localStorage.setItem("centinel_current", JSON.stringify(item));
    router.push("/result");
  };

  return (
    <div className="w-full mb-10">
      {/* Section title */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <span
          className="w-[3px] h-4 rounded-full shrink-0"
          style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
        />
        <p className="text-xs font-semibold text-[#0A1929] uppercase tracking-widest">최근 분석</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {history.map((item, i) => (
          <button
            key={i}
            onClick={() => handleClick(item)}
            className="group text-left bg-white border border-[#E8F4FC] rounded-[14px] p-4 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg hover:shadow-blue-100/60 hover:border-[#C8E4F4] shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#0B7FD4] text-xs font-bold truncate">{item.query}</span>
              <span className="text-[#4A6080] text-[10px] shrink-0 ml-2">
                {new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="text-[#4A6080] text-xs leading-relaxed line-clamp-2 mb-2">
              {item.insight.summary[0]}
            </p>
            <div className="flex flex-wrap gap-1">
              {item.insight.topKeywords.slice(0, 2).map((kw) => (
                <span key={kw} className="px-1.5 py-0.5 bg-[#EBF5FC] text-[#1A7AAF] text-[10px] rounded-full border border-[#C8E4F4]">
                  {kw}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
